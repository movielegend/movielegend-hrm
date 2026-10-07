import { Injectable } from '@nestjs/common';
import { Prisma, OtReportStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BusinessTimeService } from '../time/business-time.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import {
  CreateOtReportDto,
  UpdateOtReportDto,
  ApproveOtReportDto,
  RejectOtReportDto,
  OtReportQueryDto,
} from './dto/ot-report.dto';

@Injectable()
export class OtReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessTime: BusinessTimeService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Kiểm tra phòng ban có phải là phòng Live hay không
   */
  private isLiveDepartment(dept: { name?: string | null; code?: string | null } | null): boolean {
    if (!dept) return false;
    const name = dept.name?.toLowerCase() || '';
    const code = dept.code?.toLowerCase() || '';
    return name.includes('live') || code.includes('live');
  }

  /**
   * Tính số phút OT hợp lệ dựa trên các lượt làm việc thực tế kết hợp khoảng thời gian báo cáo và mốc tích lũy 5 giờ (300 phút)
   */
  async calculateValidOtMinutes(
    userId: string,
    otDate: Date,
    otStart: Date,
    otEnd: Date,
  ): Promise<number> {
    if (otEnd <= otStart) return 0;

    // Lấy tất cả các lượt làm việc trong ngày công này
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        userId,
        workDate: otDate,
      },
      orderBy: { checkInAt: 'asc' },
    });

    // Bắt buộc phải có ít nhất 1 lần check-in trong ngày
    if (records.length === 0) return 0;

    // Tập hợp tất cả các khoảng thời gian làm việc (từ check-in/out và từ đơn báo cáo OT)
    const rawIntervals: Array<{ start: Date; end: Date }> = [];

    for (const r of records) {
      const inTime = new Date(r.checkInAt);
      const outTime = r.checkOutAt ? new Date(r.checkOutAt) : null;
      if (outTime && outTime > inTime) {
        rawIntervals.push({ start: inTime, end: outTime });
      }
    }

    // Đưa khoảng thời gian khai báo OT vào tổng thời gian làm việc trong ngày
    rawIntervals.push({ start: otStart, end: otEnd });

    // Sắp xếp theo thời gian bắt đầu
    rawIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Hợp nhất (Merge) các khoảng thời gian trùng nhau hoặc liền kề
    const mergedIntervals: Array<{ start: Date; end: Date }> = [];
    for (const interval of rawIntervals) {
      if (mergedIntervals.length === 0) {
        mergedIntervals.push({ start: new Date(interval.start), end: new Date(interval.end) });
      } else {
        const last = mergedIntervals[mergedIntervals.length - 1];
        if (interval.start.getTime() <= last.end.getTime()) {
          if (interval.end.getTime() > last.end.getTime()) {
            last.end = new Date(interval.end);
          }
        } else {
          mergedIntervals.push({ start: new Date(interval.start), end: new Date(interval.end) });
        }
      }
    }

    // Tính mốc tích lũy 5 giờ (300 phút) trên toàn bộ dòng thời gian làm việc đã hợp nhất
    let cumulativeWorkedMinutes = 0;
    const eligibleOtIntervals: Array<{ start: Date; end: Date }> = [];
    const FIVE_HOURS_MINUTES = 300;

    for (const interval of mergedIntervals) {
      const sessionDuration = Math.max(0, Math.floor((interval.end.getTime() - interval.start.getTime()) / 60_000));
      if (sessionDuration <= 0) continue;

      const previousCumulative = cumulativeWorkedMinutes;
      cumulativeWorkedMinutes += sessionDuration;

      if (cumulativeWorkedMinutes > FIVE_HOURS_MINUTES) {
        if (previousCumulative >= FIVE_HOURS_MINUTES) {
          // Toàn bộ khoảng này nằm sau mốc 5 giờ
          eligibleOtIntervals.push({ start: interval.start, end: interval.end });
        } else {
          // Mốc 5 giờ đạt được ngay trong khoảng này
          const minutesNeededToReachFiveHours = FIVE_HOURS_MINUTES - previousCumulative;
          const milestoneTime = new Date(interval.start.getTime() + minutesNeededToReachFiveHours * 60_000);
          eligibleOtIntervals.push({ start: milestoneTime, end: interval.end });
        }
      }
    }

    if (eligibleOtIntervals.length === 0) return 0;

    // Đối chiếu giao điểm giữa các khoảng sau mốc 5 giờ và khoảng giờ đề xuất [otStart, otEnd]
    let totalValidMinutes = 0;
    for (const interval of eligibleOtIntervals) {
      const overlapStart = interval.start > otStart ? interval.start : otStart;
      const overlapEnd = interval.end < otEnd ? interval.end : otEnd;
      if (overlapEnd > overlapStart) {
        totalValidMinutes += Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 60_000);
      }
    }

    return totalValidMinutes;
  }

  async create(actor: AuthenticatedUser, dto: CreateOtReportDto) {
    // 1. Kiểm tra nhân viên thuộc phòng Live (hỗ trợ nhân sự thuộc nhiều phòng ban)
    const memberships = await this.prisma.departmentMember.findMany({
      where: { userId: actor.userId, leftAt: null },
      include: { department: true },
    });
    if (!memberships.length) {
      throw badRequest('NO_DEPARTMENT', 'Chưa xác định được phòng ban của bạn');
    }

    const liveMembership = memberships.find((m) => this.isLiveDepartment(m.department));
    if (!liveMembership || !liveMembership.department) {
      throw forbidden('NOT_LIVE_DEPARTMENT', 'Tính năng Báo cáo OT này chỉ áp dụng cho nhân viên phòng Live');
    }
    const department = liveMembership.department;

    // 2. Kiểm tra khoảng ngày OT: Trong hôm nay và 2 ngày trước (Window T-2 đến T)
    const todayStr = this.businessTime.businessDateString(new Date());
    const todayDate = this.businessTime.startOfBusinessDate(todayStr);
    const otWorkDate = this.businessTime.startOfBusinessDate(dto.otDate);

    const minAllowedDate = this.businessTime.addDays(todayDate, -2);
    if (otWorkDate < minAllowedDate || otWorkDate > todayDate) {
      throw badRequest(
        'INVALID_OT_DATE_RANGE',
        `Chỉ được tạo báo cáo OT cho ngày hôm nay và 2 ngày trước (${this.businessTime.businessDateString(minAllowedDate)} đến ${todayStr})`,
      );
    }

    // 3. Kiểm tra ngày được chọn phải có check-in
    const checkinCount = await this.prisma.attendanceRecord.count({
      where: {
        userId: actor.userId,
        workDate: otWorkDate,
      },
    });
    if (checkinCount === 0) {
      throw badRequest('NO_CHECKIN_FOUND', 'Ngày được chọn không có dữ liệu check-in');
    }

    // 4. Kiểm tra mỗi nhân viên chỉ có 1 báo cáo cho mỗi ngày OT (nếu đã REJECTED thì cho phép nộp lại)
    const existing = await this.prisma.otReport.findUnique({
      where: {
        userId_otDate: {
          userId: actor.userId,
          otDate: otWorkDate,
        },
      },
    });
    if (existing) {
      if (existing.status === OtReportStatus.PENDING) {
        throw conflict('OT_REPORT_EXISTS', 'Bạn đã tạo báo cáo OT cho ngày này đang chờ duyệt. Vui lòng mở báo cáo hiện có để chỉnh sửa!');
      }
      if (existing.status === OtReportStatus.APPROVED) {
        throw conflict('OT_REPORT_EXISTS', 'Báo cáo OT cho ngày này đã được duyệt thành công.');
      }
      // Nếu trạng thái là REJECTED: Cho phép ghi đè/nộp lại đơn mới!
    }

    const otStart = new Date(dto.startTime);
    const otEnd = new Date(dto.endTime);
    if (otEnd <= otStart) {
      throw badRequest('INVALID_TIME_RANGE', 'Giờ kết thúc OT phải sau giờ bắt đầu');
    }

    // 5. Đối chiếu lượt làm thực tế và mốc 5 giờ
    const validOtMinutes = await this.calculateValidOtMinutes(actor.userId, otWorkDate, otStart, otEnd);

    // 6. Lưu báo cáo và đính kèm ảnh
    return this.prisma.$transaction(async (tx) => {
      let report;
      if (existing && existing.status === OtReportStatus.REJECTED) {
        // Xóa ảnh cũ của báo cáo bị từ chối
        await tx.otReportPhoto.deleteMany({ where: { otReportId: existing.id } });

        // Cập nhật lại đơn bị từ chối thành PENDING với dữ liệu mới
        report = await tx.otReport.update({
          where: { id: existing.id },
          data: {
            startTime: otStart,
            endTime: otEnd,
            proposedPercent: dto.proposedPercent || 100,
            approvedPercent: null,
            reason: dto.reason,
            status: OtReportStatus.PENDING,
            validOtMinutes,
            rejectionReason: null,
            decidedByUserId: null,
            decidedAt: null,
            photos: {
              create: dto.photoFileIds.map((fileId) => ({ fileId })),
            },
          },
          include: {
            photos: {
              include: { file: true },
            },
            user: {
              select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } },
            },
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        });
      } else {
        report = await tx.otReport.create({
          data: {
            userId: actor.userId,
            departmentId: department.id,
            otDate: otWorkDate,
            startTime: otStart,
            endTime: otEnd,
            proposedPercent: dto.proposedPercent || 100,
            reason: dto.reason,
            status: OtReportStatus.PENDING,
            validOtMinutes,
            photos: {
              create: dto.photoFileIds.map((fileId) => ({ fileId })),
            },
          },
          include: {
            photos: {
              include: { file: true },
            },
            user: {
              select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } },
            },
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: existing ? 'ot_report.resubmit' : 'ot_report.create',
          entityType: 'OtReport',
          entityId: report.id,
          metadata: {
            otDate: dto.otDate,
            proposedPercent: report.proposedPercent,
            validOtMinutes,
            resubmitted: !!existing,
          },
        },
      });

      return report;
    });
  }

  /**
   * Chỉnh sửa báo cáo OT (Khi ở trạng thái PENDING hoặc REJECTED muốn nộp lại)
   */
  async update(id: string, actor: AuthenticatedUser, dto: UpdateOtReportDto) {
    const report = await this.prisma.otReport.findUnique({
      where: { id },
      include: { photos: true },
    });
    if (!report) throw notFound('OT_REPORT_NOT_FOUND', 'Không tìm thấy báo cáo OT');

    if (report.userId !== actor.userId) {
      throw forbidden('FORBIDDEN', 'Bạn không có quyền chỉnh sửa báo cáo OT này');
    }

    if (report.status !== OtReportStatus.PENDING && report.status !== OtReportStatus.REJECTED) {
      throw badRequest(
        'OT_REPORT_LOCKED',
        'Báo cáo OT đã được duyệt thành công, không thể chỉnh sửa',
      );
    }

    const otStart = dto.startTime ? new Date(dto.startTime) : report.startTime;
    const otEnd = dto.endTime ? new Date(dto.endTime) : report.endTime;
    if (otEnd <= otStart) {
      throw badRequest('INVALID_TIME_RANGE', 'Giờ kết thúc OT phải sau giờ bắt đầu');
    }

    const validOtMinutes = await this.calculateValidOtMinutes(actor.userId, report.otDate, otStart, otEnd);

    return this.prisma.$transaction(async (tx) => {
      // Cập nhật ảnh nếu có truyền
      if (dto.photoFileIds && dto.photoFileIds.length > 0) {
        await tx.otReportPhoto.deleteMany({ where: { otReportId: id } });
        await tx.otReportPhoto.createMany({
          data: dto.photoFileIds.map((fileId) => ({ otReportId: id, fileId })),
        });
      }

      const updated = await tx.otReport.update({
        where: { id },
        data: {
          startTime: otStart,
          endTime: otEnd,
          proposedPercent: dto.proposedPercent !== undefined ? dto.proposedPercent : report.proposedPercent,
          approvedPercent: null,
          reason: dto.reason !== undefined ? dto.reason : report.reason,
          status: OtReportStatus.PENDING,
          validOtMinutes,
          rejectionReason: null,
          decidedByUserId: null,
          decidedAt: null,
        },
        include: {
          photos: {
            include: { file: true },
          },
          user: {
            select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'ot_report.update',
          entityType: 'OtReport',
          entityId: id,
          metadata: { validOtMinutes },
        },
      });

      return updated;
    });
  }

  /**
   * Duyệt báo cáo OT (Leader phòng Live hoặc Admin)
   */
  async approve(id: string, actor: AuthenticatedUser, dto: ApproveOtReportDto) {
    const report = await this.prisma.otReport.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!report) throw notFound('OT_REPORT_NOT_FOUND', 'Không tìm thấy báo cáo OT');

    await this.scope.assertDepartmentAccessAsync(actor, report.departmentId);

    if (report.status !== OtReportStatus.PENDING) {
      throw badRequest('OT_REPORT_INVALID_STATE', 'Báo cáo OT không còn ở trạng thái chờ duyệt');
    }

    const approvedPercent = dto.approvedPercent || report.proposedPercent || 100;

    // Kiểm tra lại tính hợp lệ của giờ OT để leader không thể bypass điều kiện 5h thực tế
    const validOtMinutes = await this.calculateValidOtMinutes(
      report.userId,
      report.otDate,
      report.startTime,
      report.endTime,
    );

    return this.prisma.$transaction(async (tx) => {
      const approved = await tx.otReport.update({
        where: { id },
        data: {
          status: OtReportStatus.APPROVED,
          approvedPercent,
          validOtMinutes,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
        include: {
          photos: { include: { file: true } },
          user: {
            select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'ot_report.approve',
          entityType: 'OtReport',
          entityId: id,
          metadata: { approvedPercent, validOtMinutes },
        },
      });

      const notif = await this.notifications.createForUsers(tx, [report.userId], {
        type: NotificationType.SYSTEM,
        title: 'Báo cáo OT đã được duyệt',
        body: `Báo cáo OT ngày ${this.businessTime.businessDateString(report.otDate)} đã được duyệt với mức ${approvedPercent}%.`,
        metadata: { otReportId: id },
      });

      this.notifications.emitCreated(notif);
      return approved;
    });
  }

  /**
   * Không công nhận báo cáo OT (Leader)
   */
  async reject(id: string, actor: AuthenticatedUser, dto: RejectOtReportDto) {
    const report = await this.prisma.otReport.findUnique({ where: { id } });
    if (!report) throw notFound('OT_REPORT_NOT_FOUND', 'Không tìm thấy báo cáo OT');

    await this.scope.assertDepartmentAccessAsync(actor, report.departmentId);

    if (report.status !== OtReportStatus.PENDING) {
      throw badRequest('OT_REPORT_INVALID_STATE', 'Báo cáo OT không còn ở trạng thái chờ duyệt');
    }

    return this.prisma.$transaction(async (tx) => {
      const rejected = await tx.otReport.update({
        where: { id },
        data: {
          status: OtReportStatus.REJECTED,
          rejectionReason: dto.rejectionReason,
          validOtMinutes: 0,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
        include: {
          photos: { include: { file: true } },
          user: {
            select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'ot_report.reject',
          entityType: 'OtReport',
          entityId: id,
          metadata: { rejectionReason: dto.rejectionReason },
        },
      });

      const notif = await this.notifications.createForUsers(tx, [report.userId], {
        type: NotificationType.SYSTEM,
        title: 'Báo cáo OT không được công nhận',
        body: `Báo cáo OT ngày ${this.businessTime.businessDateString(report.otDate)} không được công nhận. Lý do: ${dto.rejectionReason}`,
        metadata: { otReportId: id },
      });

      this.notifications.emitCreated(notif);
      return rejected;
    });
  }

  /**
   * Lấy danh sách báo cáo OT của tôi
   */
  async findMyReports(actor: AuthenticatedUser, query: OtReportQueryDto) {
    const where: Prisma.OtReportWhereInput = {
      userId: actor.userId,
      ...(query.status ? { status: query.status } : {}),
      ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
        ? { otDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
        : {}),
    };

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [items, total] = await Promise.all([
      this.prisma.otReport.findMany({
        where,
        include: {
          photos: { include: { file: true } },
          department: { select: { id: true, name: true, code: true } },
        },
        orderBy: { otDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.otReport.count({ where }),
    ]);

    const populatedItems = await Promise.all(
      items.map(async (item) => {
        if (item.status === OtReportStatus.PENDING) {
          const freshMinutes = await this.calculateValidOtMinutes(
            item.userId,
            item.otDate,
            item.startTime,
            item.endTime,
          );
          if (freshMinutes !== item.validOtMinutes) {
            item.validOtMinutes = freshMinutes;
            void this.prisma.otReport
              .update({
                where: { id: item.id },
                data: { validOtMinutes: freshMinutes },
              })
              .catch(() => null);
          }
        }
        return item;
      }),
    );

    return {
      items: populatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy danh sách báo cáo OT chờ duyệt (Leader phòng Live)
   */
  async findPendingReports(actor: AuthenticatedUser, query: OtReportQueryDto) {
    const visibleDepartmentIds = await this.scope.getVisibleDepartmentIds(actor);

    const where: Prisma.OtReportWhereInput = {
      status: query.status || OtReportStatus.PENDING,
      ...(visibleDepartmentIds ? { departmentId: { in: visibleDepartmentIds } } : {}),
      ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
        ? { otDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
        : {}),
    };

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [items, total] = await Promise.all([
      this.prisma.otReport.findMany({
        where,
        include: {
          photos: { include: { file: true } },
          user: {
            select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } },
          },
          department: { select: { id: true, name: true, code: true } },
        },
        orderBy: { otDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.otReport.count({ where }),
    ]);

    const populatedItems = await Promise.all(
      items.map(async (item) => {
        if (item.status === OtReportStatus.PENDING) {
          const freshMinutes = await this.calculateValidOtMinutes(
            item.userId,
            item.otDate,
            item.startTime,
            item.endTime,
          );
          if (freshMinutes !== item.validOtMinutes) {
            item.validOtMinutes = freshMinutes;
            void this.prisma.otReport
              .update({
                where: { id: item.id },
                data: { validOtMinutes: freshMinutes },
              })
              .catch(() => null);
          }
        }
        return item;
      }),
    );

    return {
      items: populatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết 1 báo cáo OT
   */
  async findOne(id: string, actor: AuthenticatedUser) {
    const report = await this.prisma.otReport.findUnique({
      where: { id },
      include: {
        photos: { include: { file: true } },
        user: {
          select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } },
        },
        department: { select: { id: true, name: true, code: true } },
      },
    });
    if (!report) throw notFound('OT_REPORT_NOT_FOUND', 'Không tìm thấy báo cáo OT');

    // Chỉ chính chủ hoặc Leader có quyền truy cập
    if (report.userId !== actor.userId) {
      await this.scope.assertDepartmentAccessAsync(actor, report.departmentId);
    }

    if (report.status === OtReportStatus.PENDING) {
      const freshMinutes = await this.calculateValidOtMinutes(
        report.userId,
        report.otDate,
        report.startTime,
        report.endTime,
      );
      if (freshMinutes !== report.validOtMinutes) {
        report.validOtMinutes = freshMinutes;
        void this.prisma.otReport
          .update({
            where: { id: report.id },
            data: { validOtMinutes: freshMinutes },
          })
          .catch(() => null);
      }
    }

    return report;
  }
}
