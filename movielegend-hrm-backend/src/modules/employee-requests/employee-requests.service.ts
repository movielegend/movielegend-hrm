import { Injectable } from '@nestjs/common';
import { AccountStatus, EmployeeRequestStatus, EmployeeRequestType, Prisma, NotificationType, RoleScopeType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import moment from 'moment-timezone';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { BusinessTimeService } from '../time/business-time.service';
import {
  CreateEmployeeRequestDto,
  EmployeeRequestQueryDto,
  ApproveEmployeeRequestDto,
  RejectEmployeeRequestDto,
  ExportTransactionsQueryDto,
  ImportPaymentBatchDto,
  ImportPaymentItemDto,
  CreateExpenseFromPurchaseDto,
  ResubmitPurchaseByHrDto,
  FulfillPurchaseByHrDto,
} from './dto/employee-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EmployeeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly businessTime: BusinessTimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateEmployeeRequestDto, actor: AuthenticatedUser) {
    const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
    this.assertFinancialRequest(dto);
    const isAccountDeletion = (dto.type as string) === 'ACCOUNT_DELETION';

    // Last Admin Protection Rule
    if (isAccountDeletion && actor.roles.includes('ADMIN')) {
      const activeAdminCount = await this.prisma.user.count({
        where: {
          accountStatus: 'ACTIVE',
          isActive: true,
          deletedAt: null,
          roles: {
            some: {
              role: { code: 'ADMIN' },
            },
          },
        },
      });

      if (activeAdminCount <= 1) {
        throw badRequest(
          'LAST_ADMIN_PROTECTION',
          'Không thể xóa tài khoản. Bạn hiện là Quản trị viên (Admin) duy nhất còn hoạt động trong hệ thống. Vui lòng phân quyền Admin cho một thành viên khác trước khi rời đi.',
        );
      }
    }

    const isCompensatoryWork = (dto.type as string) === 'COMPENSATORY_WORK' || dto.title?.includes('[LÀM BÙ]');
    const requestType = (isAccountDeletion || isCompensatoryWork) ? EmployeeRequestType.OTHER : dto.type;
    let requestTitle = dto.title;
    if (isAccountDeletion && !dto.title.includes('[ACCOUNT_DELETION]')) {
      requestTitle = `[ACCOUNT_DELETION] ${dto.title}`;
    } else if (isCompensatoryWork && (!dto.title || dto.title.trim() === '' || !dto.title.includes('[LÀM BÙ]'))) {
      const meta: any = dto.attachmentMetadata || {};
      const targetDate = meta.targetLeaveDate
        ? moment.tz(meta.targetLeaveDate, 'Asia/Ho_Chi_Minh').format('DD/MM/YYYY')
        : '';
      const compDate = meta.compensatoryDate
        ? moment.tz(meta.compensatoryDate, 'Asia/Ho_Chi_Minh').format('DD/MM/YYYY')
        : '';
      const shiftName = meta.compensatoryShiftName || (meta.missedHours ? `${meta.missedHours}h` : 'ca làm');
      requestTitle = `[LÀM BÙ] Làm bù ${shiftName}${compDate ? ` ngày ${compDate}` : ''}${targetDate ? ` cho ngày ${targetDate}` : ''}`;
    } else if (dto.type === EmployeeRequestType.BUSINESS_TRIP && (!dto.title || dto.title.trim() === '' || dto.title === 'Công tác' || dto.title === 'Yêu cầu')) {
      const meta: any = dto.attachmentMetadata || {};
      const loc = meta.location || 'Ngoài công ty';
      const fromD = meta.fromDate
        ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('DD/MM/YYYY')
        : '';
      const toD = meta.toDate
        ? moment.tz(meta.toDate, 'Asia/Ho_Chi_Minh').format('DD/MM/YYYY')
        : fromD;
      requestTitle = `Công tác: ${loc}${fromD ? ` (${fromD}${toD && toD !== fromD ? ` -> ${toD}` : ''})` : ''}`;
    }

    const isFinancial = dto.type === EmployeeRequestType.ADVANCE || dto.type === EmployeeRequestType.EXPENSE || dto.type === EmployeeRequestType.PURCHASE;
    const isAdvance = dto.type === EmployeeRequestType.ADVANCE;

    let leaderId: string | undefined;
    if (departmentId && !isAccountDeletion) {
      const dept = await this.prisma.department.findUnique({
        where: { id: departmentId },
        select: { leaderUserId: true },
      });
      if (dept?.leaderUserId) {
        leaderId = dept.leaderUserId;
      }
    }

    const isCreatorLeader = (leaderId && leaderId === actor.userId) || actor.roles.includes('LEADER');
    const hasVat = Boolean((dto.attachmentMetadata as any)?.hasVat);
    const amountVal = Number(dto.amount || 0);
    const NON_VAT_ADMIN_THRESHOLD = 2000000; // 2.000.000 VNĐ theo sơ đồ (Trên 2tr: A Kiên)

    // Kiểm tra quy định cho Đơn Nghỉ Phép (LEAVE)
    if (dto.type === EmployeeRequestType.LEAVE) {
      const meta: any = dto.attachmentMetadata || {};
      if (meta.leaveDurationType === 'Theo giờ') {
        if (!meta.startTime) {
          throw badRequest('MISSING_START_TIME', 'Vui lòng chọn thời gian bắt đầu nghỉ');
        }

        const dateStr = meta.fromDate
          ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD')
          : moment.tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
        const timeStr = moment.tz(meta.startTime, 'Asia/Ho_Chi_Minh').format('HH:mm:ss');
        const startMoment = moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Ho_Chi_Minh');
        const nowMoment = moment.tz('Asia/Ho_Chi_Minh');

        const diffMinutes = startMoment.diff(nowMoment, 'minutes', true);
        if (diffMinutes < 180) {
          throw badRequest(
            'LEAVE_HOURLY_ADVANCE_NOTICE_REQUIRED',
            'Đơn nghỉ theo giờ phải được tạo trước thời điểm bắt đầu nghỉ ít nhất 3 tiếng.',
          );
        }
      }
    }

    // Kiểm tra quy định cho Đơn Làm bù (COMPENSATORY_WORK)
    if (isCompensatoryWork) {
      if (!dto.referenceId) {
        throw badRequest(
          'MISSING_LEAVE_REFERENCE',
          'Vui lòng chọn đơn nghỉ phép đã được phê duyệt để thực hiện làm bù.',
        );
      }

      const referencedLeave = await this.prisma.employeeRequest.findUnique({
        where: { id: dto.referenceId },
      });
      if (!referencedLeave || referencedLeave.userId !== actor.userId) {
        throw badRequest('INVALID_LEAVE_REFERENCE', 'Đơn nghỉ phép tham chiếu không hợp lệ hoặc không thuộc về bạn.');
      }
      if (referencedLeave.status !== EmployeeRequestStatus.APPROVED) {
        throw badRequest(
          'LEAVE_NOT_APPROVED',
          'Đơn nghỉ phép tham chiếu chưa được phê duyệt. Chỉ đơn đã duyệt mới được làm bù.',
        );
      }
    }

    // Xử lý riêng cho Đơn Tạm ứng Lương (ADVANCE) - Leader sẽ trực tiếp xét duyệt
    if (isAdvance) {
      if (amountVal <= 0) {
        throw badRequest('INVALID_ADVANCE_AMOUNT', 'Số tiền tạm ứng lương phải lớn hơn 0');
      }

      if (!requestTitle || requestTitle === 'Tạm ứng' || requestTitle === 'Yêu cầu') {
        const n = new Date();
        requestTitle = `[TẠM ỨNG LƯƠNG] Đề xuất tạm ứng lương tháng ${n.getMonth() + 1}/${n.getFullYear()}`;
      }
    }

    const isPurchase = requestType === EmployeeRequestType.PURCHASE;
    let initialStage = 'PENDING';
    if (isFinancial) {
      if (isAdvance) {
        // Tạm ứng lương: Nhân viên -> Leader duyệt -> Kế toán trưởng duyệt & đi lương
        // Nếu chính Leader đề xuất -> Chuyển thẳng Kế toán trưởng
        initialStage = isCreatorLeader ? 'PENDING_ACCOUNTANT' : 'PENDING_LEADER';
      } else if (isPurchase) {
        // Đề xuất mua sắm: Nhân viên -> Leader duyệt -> HR đối chứng & cấp STK -> Kế toán/Admin chi tiền -> HR mua hàng
        // Nếu chính Leader đề xuất -> Chuyển thẳng HR tiếp nhận & cấp STK
        initialStage = isCreatorLeader ? 'PENDING_HR' : 'PENDING_LEADER';
      } else if (isCreatorLeader) {
        if (hasVat) {
          initialStage = 'PENDING_ACCOUNTANT';
        } else if (amountVal > NON_VAT_ADMIN_THRESHOLD) {
          initialStage = 'PENDING_ADMIN';
        } else {
          initialStage = 'PENDING_ACCOUNTANT';
        }
      } else {
        initialStage = 'PENDING_LEADER';
      }
    }

    const attachmentMetadata = {
      ...(typeof dto.attachmentMetadata === 'object' && dto.attachmentMetadata !== null ? dto.attachmentMetadata : {}),
      ...(isCompensatoryWork ? { requestType: 'COMPENSATORY_WORK' } : {}),
      ...(isFinancial ? { stage: initialStage, approvalSteps: [] } : {}),
    };

    const request = await this.prisma.employeeRequest.create({
      data: {
        userId: actor.userId,
        departmentId,
        type: requestType,
        title: requestTitle,
        content: dto.content,
        amount: dto.amount,
        attachmentMetadata: attachmentMetadata as Prisma.InputJsonValue | undefined,
        referenceId: dto.referenceId,
      },
      include: {
        user: { select: { profile: { select: { fullName: true } } } },
      },
    });

    // Notify the target roles based on stage
    let targetUserIds: string[] = [];
    if (isAccountDeletion) {
      targetUserIds = await this.findRelevantAdminUserIds(departmentId, this.prisma);
    } else if (initialStage === 'PENDING_LEADER') {
      if (leaderId && leaderId !== actor.userId) {
        targetUserIds = [leaderId];
      }
    } else if (initialStage === 'PENDING_ADMIN') {
      targetUserIds = await this.findRelevantAdminUserIds(departmentId, this.prisma);
    } else if (initialStage === 'PENDING_ACCOUNTANT') {
      targetUserIds = await this.findAccountantUserIds(this.prisma);
    } else if (initialStage === 'PENDING_HR') {
      targetUserIds = await this.findHrUserIds(this.prisma);
    } else if (initialStage === 'PENDING') {
      if (leaderId && leaderId !== actor.userId) {
        targetUserIds = [leaderId];
      } else {
        const [hrIds, adminIds] = await Promise.all([
          this.findHrUserIds(this.prisma),
          this.findRelevantAdminUserIds(departmentId, this.prisma),
        ]);
        targetUserIds = Array.from(new Set([...hrIds, ...adminIds])).filter((id) => id !== actor.userId);
      }
    }

    if (targetUserIds.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        const notif = await this.notifications.createForUsers(
          tx as any,
          targetUserIds,
          {
            type: 'SYSTEM' as NotificationType,
            title: isFinancial ? `Đơn ${dto.type === 'ADVANCE' ? 'ứng lương' : 'thanh toán'} mới` : 'Yêu cầu mới',
            body: `${request.user?.profile?.fullName || 'Nhân viên'} vừa gửi yêu cầu: ${request.title}`,
            metadata: { requestId: request.id },
          },
        );
        if (notif) this.notifications.emitCreated(notif);
      });
    }

    return request;
  }

  async findAll(actor: AuthenticatedUser, departmentId?: string, status?: EmployeeRequestStatus) {
    const isAccountant = await this.isAccountantActor(actor);
    const isHr = await this.isHrActor(actor);
    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !isRegionAdmin) || this.scope.isGlobalAdmin(actor);

    let where: Prisma.EmployeeRequestWhereInput = {};

    if (isRegionAdmin) {
      const visibleDepartmentIds = (await this.scope.getVisibleDepartmentIds(actor)) ?? [];
      if (departmentId) {
        if (!visibleDepartmentIds.includes(departmentId)) {
          throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền truy cập phòng ban này');
        }
        where = { departmentId };
      } else {
        where = {
          departmentId: {
            in: visibleDepartmentIds.length > 0 ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'],
          },
        };
      }
    } else if (isGlobalAdmin) {
      if (departmentId) {
        where = { departmentId };
      }
    } else if (isHr) {
      // HR: manages all non-financial requests across company,
      // PLUS all requests in their own department(s)
      const ledDeptIds = await this.scope.getLedDepartmentIds(actor);
      const ownDeptIds = [...ledDeptIds];
      try {
        const primaryDeptId = await this.scope.getPrimaryDepartmentId(actor.userId);
        if (primaryDeptId && !ownDeptIds.includes(primaryDeptId)) {
          ownDeptIds.push(primaryDeptId);
        }
      } catch {}

      const nonFinancialTypes: EmployeeRequestType[] = [
        EmployeeRequestType.LEAVE,
        EmployeeRequestType.ATTENDANCE_ADJUSTMENT,
        EmployeeRequestType.BUSINESS_TRIP,
        EmployeeRequestType.OVERTIME,
        EmployeeRequestType.EQUIPMENT,
        EmployeeRequestType.OTHER,
        EmployeeRequestType.PURCHASE, // HR quản lý và duyệt thẩm định / cấp STK cho đề xuất mua sắm
      ];

      if (departmentId) {
        if (ownDeptIds.includes(departmentId)) {
          where = { departmentId };
        } else {
          where = {
            departmentId,
            type: { in: nonFinancialTypes },
          };
        }
      } else {
        const orConditions: Prisma.EmployeeRequestWhereInput[] = [
          { type: { in: nonFinancialTypes } },
        ];
        if (ownDeptIds.length > 0) {
          orConditions.push({ departmentId: { in: ownDeptIds } });
        }
        where = { OR: orConditions };
      }
    } else if (isAccountant) {
      // Accountant: can see ALL financial requests across all departments,
      // PLUS any requests within their own led or primary department(s)
      const ledDeptIds = await this.scope.getLedDepartmentIds(actor);
      const ownDeptIds = [...ledDeptIds];
      try {
        const primaryDeptId = await this.scope.getPrimaryDepartmentId(actor.userId);
        if (primaryDeptId && !ownDeptIds.includes(primaryDeptId)) {
          ownDeptIds.push(primaryDeptId);
        }
      } catch {}

      const financialTypes: EmployeeRequestType[] = [
        EmployeeRequestType.ADVANCE,
        EmployeeRequestType.EXPENSE,
        EmployeeRequestType.PURCHASE,
      ];

      if (departmentId) {
        if (ownDeptIds.includes(departmentId)) {
          where = { departmentId };
        } else {
          where = {
            departmentId,
            type: { in: financialTypes },
          };
        }
      } else {
        const orConditions: Prisma.EmployeeRequestWhereInput[] = [
          { type: { in: financialTypes } },
        ];
        if (ownDeptIds.length > 0) {
          orConditions.push({ departmentId: { in: ownDeptIds } });
        }
        where = { OR: orConditions };
      }
    } else {
      const visibleDepartmentIds = await this.scope.getVisibleDepartmentIds(actor);
      const departmentFilter = this.departmentFilter(departmentId, visibleDepartmentIds);
      if (departmentFilter) {
        where = { departmentId: departmentFilter };
      }
    }

    const finalWhere: Prisma.EmployeeRequestWhereInput = status
      ? { AND: [where, { status }] }
      : where;

    return this.prisma.employeeRequest.findMany({
      where: finalWhere,
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            phone: true,
            email: true,
            profile: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const request = await this.prisma.employeeRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            phone: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                position: { select: { name: true } },
              },
            },
          },
        },
        department: { select: { id: true, name: true, leaderUserId: true } },
      },
    });

    if (!request) {
      throw notFound('REQUEST_NOT_FOUND', 'Yêu cầu không tồn tại');
    }

    const isOwner = request.userId === actor.userId;
    const isAccountant = await this.isAccountantActor(actor);
    const isHr = await this.isHrActor(actor);
    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !isRegionAdmin) || this.scope.isGlobalAdmin(actor);
    const isFinancial =
      request.type === EmployeeRequestType.ADVANCE ||
      request.type === EmployeeRequestType.EXPENSE ||
      request.type === EmployeeRequestType.PURCHASE;

    let canView = false;
    if (isOwner || isGlobalAdmin || isHr) {
      canView = true;
    } else if (isFinancial && isAccountant) {
      canView = true;
    } else if (request.departmentId && (await this.scope.canAccessDepartmentAsync(actor, request.departmentId))) {
      canView = true;
    }

    if (!canView) {
      throw forbidden('FORBIDDEN', 'Bạn không có quyền xem yêu cầu này');
    }

    return request;
  }

  async findMine(actor: AuthenticatedUser, query: EmployeeRequestQueryDto) {
    const where: Prisma.EmployeeRequestWhereInput = {
      userId: actor.userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
        ? { createdAt: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.employeeRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              profile: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.employeeRequest.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async approve(id: string, actor: AuthenticatedUser, payload?: ApproveEmployeeRequestDto) {
    const request = await this.prisma.employeeRequest.findUnique({
      where: { id },
      include: {
        user: { select: { profile: { select: { fullName: true } } } },
        department: true,
      },
    });
    if (!request) throw notFound('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');

    const isAccountDeletion = (request.type as string) === 'ACCOUNT_DELETION' || request.title.includes('[ACCOUNT_DELETION]');
    if (isAccountDeletion) {
      if (!actor.roles.includes('ADMIN')) {
        throw forbidden('ADMIN_ONLY_APPROVAL', 'Chỉ Quản trị viên (ADMIN) mới có quyền duyệt đơn xóa tài khoản.');
      }
      await this.scope.assertUserInScope(actor, request.userId);
    }

    if (request.status !== EmployeeRequestStatus.PENDING) {
      throw badRequest('EMPLOYEE_REQUEST_NOT_PENDING', 'Yêu cầu không còn ở trạng thái chờ xử lý');
    }

    const isFinancial = request.type === EmployeeRequestType.ADVANCE || request.type === EmployeeRequestType.EXPENSE || request.type === EmployeeRequestType.PURCHASE;
    const currentMeta = (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null)
      ? { ...(request.attachmentMetadata as Record<string, any>) }
      : {};
    const currentStage = currentMeta.stage || 'PENDING';
    const amount = Number(request.amount || 0);

    const isAccountant = await this.isAccountantActor(actor);
    const isHr = await this.isHrActor(actor);
    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !isRegionAdmin) || this.scope.isGlobalAdmin(actor);
    const canDeptAccess = request.departmentId ? await this.scope.canAccessDepartmentAsync(actor, request.departmentId) : false;

    const actorProfile = await this.prisma.employeeProfile.findUnique({
      where: { userId: actor.userId },
      include: {
        bankAccounts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          take: 1,
        },
      },
    });
    const primaryBank = actorProfile?.bankAccounts?.[0];
    const actorName = actorProfile?.fullName || (actor.roles.includes('ADMIN') ? 'Ban Giám Đốc' : isHr ? 'Trưởng phòng HR' : isAccountant ? 'Kế toán' : 'Trưởng bộ phận');
    const existingSteps = Array.isArray(currentMeta.approvalSteps) ? currentMeta.approvalSteps : [];

    // --- STANDARD / NON-FINANCIAL REQUEST APPROVAL ---
    if (!isFinancial) {
      if (!isAccountDeletion) {
        if (!isGlobalAdmin && !isHr && !canDeptAccess) {
          throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền duyệt yêu cầu của phòng ban này');
        }
      }

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.employeeRequest.update({
          where: { id },
          data: { status: EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
        });

        if (request.type === EmployeeRequestType.ATTENDANCE_ADJUSTMENT) {
          const meta: any = request.attachmentMetadata;
          const targetRecordId = meta?.attendanceRecordId || request.referenceId;
          const reqCheckIn = meta?.requestedCheckInAt ? new Date(meta.requestedCheckInAt) : null;
          const reqCheckOut = meta?.requestedCheckOutAt ? new Date(meta.requestedCheckOutAt) : null;

          if (targetRecordId) {
            await tx.attendanceRecord.update({
              where: { id: targetRecordId },
              data: {
                ...(reqCheckIn ? { checkInAt: reqCheckIn } : {}),
                ...(reqCheckOut ? { checkOutAt: reqCheckOut } : {}),
                status: 'ADJUSTED',
              },
            }).catch(() => null);
          }
        }

        if (request.type === EmployeeRequestType.BUSINESS_TRIP) {
          const meta: any = request.attachmentMetadata || {};
          const fromDateStr = meta.fromDate
            ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD')
            : null;
          const toDateStr = meta.toDate
            ? moment.tz(meta.toDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD')
            : fromDateStr;
          const location = meta.location || '';
          const startTime = meta.startTime || '08:00';
          const endTime = meta.endTime || '17:30';

          if (fromDateStr) {
            const start = moment.tz(fromDateStr, 'YYYY-MM-DD', 'Asia/Ho_Chi_Minh');
            const end = moment.tz(toDateStr || fromDateStr, 'YYYY-MM-DD', 'Asia/Ho_Chi_Minh');
            const curr = moment(start);

            while (curr.isSameOrBefore(end, 'day')) {
              const workDateStr = curr.format('YYYY-MM-DD');
              const workDate = this.businessTime.startOfBusinessDate(workDateStr);

              let sh = 8;
              let sm = 0;
              if (startTime && typeof startTime === 'string' && startTime.includes(':')) {
                const parts = startTime.split(':');
                sh = parseInt(parts[0], 10) || 8;
                sm = parseInt(parts[1], 10) || 0;
              }
              let eh = 17;
              let em = 30;
              if (endTime && typeof endTime === 'string' && endTime.includes(':')) {
                const parts = endTime.split(':');
                eh = parseInt(parts[0], 10) || 17;
                em = parseInt(parts[1], 10) || 30;
              }

              const checkInAt = moment.tz(`${workDateStr} ${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Ho_Chi_Minh').toDate();
              const checkOutAt = moment.tz(`${workDateStr} ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Ho_Chi_Minh').toDate();

              const existing = await tx.attendanceRecord.findFirst({
                where: {
                  userId: request.userId,
                  workDate,
                },
              });

              const noteText = `Đi công tác${location ? `: ${location}` : ''}`;

              if (existing) {
                await tx.attendanceRecord.update({
                  where: { id: existing.id },
                  data: {
                    latePenaltyWorkDays: 1,
                    latePenaltyAmount: 0,
                    lateMinutes: 0,
                    status: 'ADJUSTED',
                    notes: existing.notes ? `${existing.notes} | ${noteText}` : noteText,
                    ...(existing.checkOutAt ? {} : { checkOutAt }),
                  },
                });
              } else {
                const deptId = request.departmentId || (await this.scope.getPrimaryDepartmentId(request.userId));
                if (deptId) {
                  await tx.attendanceRecord.create({
                    data: {
                      userId: request.userId,
                      departmentId: deptId,
                      workDate,
                      checkInAt,
                      checkOutAt,
                      status: 'ADJUSTED',
                      latePenaltyWorkDays: 1,
                      latePenaltyAmount: 0,
                      lateMinutes: 0,
                      notes: noteText,
                      isUnplannedOt: false,
                    },
                  });
                }
              }

              curr.add(1, 'day');
            }
          }
        }

        const isCompensatory = (request.type as string) === 'COMPENSATORY_WORK' ||
          request.title.includes('[LÀM BÙ]') ||
          (request.attachmentMetadata as any)?.requestType === 'COMPENSATORY_WORK';

        if (isCompensatory) {
          const meta: any = request.attachmentMetadata || {};
          const compDateStr = meta.compensatoryDate
            ? moment.tz(meta.compensatoryDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD')
            : null;
          const shiftId = meta.compensatoryShiftId;
          const deptId = request.departmentId || (await this.scope.getPrimaryDepartmentId(request.userId));

          if (compDateStr && shiftId && deptId) {
            const workDate = this.businessTime.startOfBusinessDate(compDateStr);
            const existingAssignment = await tx.shiftAssignment.findFirst({
              where: { userId: request.userId, workDate },
            });

            const targetDateStr = meta.targetLeaveDate
              ? moment.tz(meta.targetLeaveDate, 'Asia/Ho_Chi_Minh').format('DD/MM/YYYY')
              : '';
            const noteText = `Ca làm bù${targetDateStr ? ` cho ngày ${targetDateStr}` : ''}`;

            let assignedId = existingAssignment?.id;
            if (existingAssignment) {
              await tx.shiftAssignment.update({
                where: { id: existingAssignment.id },
                data: {
                  shiftId,
                  assignedByUserId: actor.userId,
                },
              });
            } else {
              const newAssignment = await tx.shiftAssignment.create({
                data: {
                  userId: request.userId,
                  departmentId: deptId,
                  shiftId,
                  workDate,
                  assignedByUserId: actor.userId,
                },
              });
              assignedId = newAssignment.id;
            }

            // Hồi tố: nếu nhân viên đã check-in ngày hôm đó rồi (trường hợp làm bù trước, duyệt sau)
            // thì cập nhật lại bản ghi chấm công gắn với ca vừa cấp, hủy cờ isUnplannedOt
            if (assignedId) {
              await tx.attendanceRecord.updateMany({
                where: {
                  userId: request.userId,
                  workDate,
                },
                data: {
                  shiftAssignmentId: assignedId,
                  isUnplannedOt: false,
                },
              });
            }
          }
        }

        if (isAccountDeletion) {
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + 30);
          await tx.user.update({
            where: { id: request.userId },
            data: {
              accountStatus: AccountStatus.SUSPENDED,
              deletionScheduledAt: scheduledDate,
              isActive: false,
            } as any,
          });

          const actorProfile = await tx.employeeProfile.findUnique({ where: { userId: actor.userId } });
          const actorName = actorProfile?.fullName || 'Quản trị viên';
          const targetUser = await tx.user.findUnique({ where: { id: request.userId }, include: { profile: true } });

          await this.notifications.notifyAccountantsOnHrEvent(tx, {
            eventType: 'DELETED_EMPLOYEE',
            employeeName: targetUser?.profile?.fullName || targetUser?.userCode || 'Nhân sự',
            userCode: targetUser?.userCode || '',
            departmentName: request.department?.name,
            reason: 'Duyệt đơn xin xóa tài khoản (đặt lịch xóa sau 30 ngày)',
            performedByName: actorName,
          });
        } else if (request.title.toLowerCase().includes('nghỉ việc') || request.title.toLowerCase().includes('thôi việc')) {
          const actorProfile = await tx.employeeProfile.findUnique({ where: { userId: actor.userId } });
          const actorName = actorProfile?.fullName || 'Quản lý';
          const targetUser = await tx.user.findUnique({ where: { id: request.userId }, include: { profile: true } });

          await this.notifications.notifyAccountantsOnHrEvent(tx, {
            eventType: 'RESIGNED_EMPLOYEE',
            employeeName: targetUser?.profile?.fullName || targetUser?.userCode || 'Nhân sự',
            userCode: targetUser?.userCode || '',
            departmentName: request.department?.name,
            reason: `Duyệt đơn: ${request.title}`,
            performedByName: actorName,
          });
        }

        const notif = await this.notifications.createForUsers(tx, [request.userId], {
          type: NotificationType.SYSTEM,
          title: 'Yêu cầu đã được duyệt',
          body: `Yêu cầu "${request.title}" của bạn đã được duyệt.`,
          metadata: { requestId: id },
        });
        if (notif) this.notifications.emitCreated(notif);

        return updated;
      });
    }

    // --- MULTI-TIER FINANCIAL & PURCHASE WORKFLOW (ADVANCE / EXPENSE / PURCHASE) ---
    return this.prisma.$transaction(async (tx) => {
      const isPurchase = request.type === EmployeeRequestType.PURCHASE;
      const hasVat = Boolean(currentMeta.hasVat);
      const NON_VAT_ADMIN_THRESHOLD = 2000000; // 2.000.000 VNĐ

      // 1. Leader Approval stage
      if (currentStage === 'PENDING_LEADER') {
        const isLeader = request.department?.leaderUserId === actor.userId;
        if (!isLeader && !isGlobalAdmin && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ Trưởng bộ phận hoặc Quản trị viên quản lý phòng ban mới có quyền duyệt bước này.');
        }

        const nextStage = isPurchase ? 'PENDING_HR' : 'PENDING_ACCOUNTANT';
        const defaultNote = isPurchase
          ? 'Leader đã duyệt đề xuất mua hàng, chuyển HR đối chứng & xác nhận'
          : 'Leader đã duyệt - Chuyển Kế toán xem xét xử lý';

        const newStep = {
          stage: 'PENDING_LEADER',
          action: 'APPROVED',
          actorId: actor.userId,
          actorName,
          note: payload?.note || defaultNote,
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: nextStage,
          approvalSteps: [...existingSteps, newStep],
        };

        const updated = await tx.employeeRequest.update({
          where: { id },
          data: {
            attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
          },
        });

        if (isPurchase) {
          // Thông báo đến toàn bộ HR
          const hrUserIds = await this.findHrUserIds(tx);
          if (hrUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, hrUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đề xuất mua sắm cần HR xử lý 🛒',
              body: `Leader đã duyệt đề xuất "${request.title}" của ${request.user?.profile?.fullName || 'nhân viên'}. Chuyển HR đối chứng và cung cấp STK nhận tiền mua sắm.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        } else {
          // Thông báo đến toàn bộ Kế toán
          const accountantUserIds = await this.findAccountantUserIds(tx);
          if (accountantUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn thanh toán chuyển Kế toán',
              body: `Leader đã duyệt đơn "${request.title}". Chuyển Kế toán xem xét xử lý.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        }

        return updated;
      }

      // 2. Backward compatibility & Purchase HR Review: PENDING_HR
      if (currentStage === 'PENDING_HR') {
        if (!isHr && !actor.roles.includes('ADMIN')) {
          throw forbidden('FORBIDDEN', 'Chỉ Leader HR hoặc Quản trị viên mới có quyền đối chứng và duyệt bước này.');
        }

        if (isPurchase) {
          const bankAccount = payload?.bankAccount?.trim() || primaryBank?.accountNumber?.trim();
          const bankName = payload?.bankName?.trim() || primaryBank?.bankName?.trim();
          const accountHolder = payload?.accountHolder?.trim() || primaryBank?.accountName?.trim() || actorProfile?.fullName?.trim();

          if (!bankAccount || !bankName) {
            throw badRequest('HR_BANK_INFO_REQUIRED', 'Vui lòng cung cấp Số tài khoản và Tên ngân hàng của HR để Kế toán chuyển tiền mua hàng.');
          }

          const hrBank = {
            bankAccount,
            bankName,
            accountHolder: accountHolder || 'HR Phụ trách mua sắm',
          };

          const newAmount = (payload?.adjustedAmount && Number(payload.adjustedAmount) > 0)
            ? Number(payload.adjustedAmount)
            : amount;

          const nextStage = 'PENDING_ACCOUNTANT';
          const newStep = {
            stage: 'PENDING_HR',
            action: 'APPROVED',
            actorId: actor.userId,
            actorName,
            note: payload?.note || 'HR đã đối chứng báo giá và xác nhận thông tin tài khoản nhận tiền',
            hrBank,
            adjustedAmount: (payload?.adjustedAmount && Number(payload.adjustedAmount) > 0) ? newAmount : undefined,
            at: new Date().toISOString(),
          };

          const updatedMeta = {
            ...currentMeta,
            hrBank,
            stage: nextStage,
            hrApprovedAt: new Date().toISOString(),
            hrApprovedBy: actor.userId,
            approvalSteps: [...existingSteps, newStep],
          };

          const updated = await tx.employeeRequest.update({
            where: { id },
            data: {
              ...(newAmount !== amount ? { amount: newAmount } : {}),
              attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
            },
          });

          const accountantUserIds = await this.findAccountantUserIds(tx);
          if (accountantUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đề xuất mua sắm chờ Kế toán chuyển tiền 💳',
              body: `HR đã duyệt đề xuất "${request.title}" (${newAmount.toLocaleString('vi-VN')} VNĐ) và cung cấp STK nhận tiền. Chuyển Kế toán giải ngân.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }

          return updated;
        }

        const nextStage = (hasVat || amount <= NON_VAT_ADMIN_THRESHOLD) ? 'PENDING_ACCOUNTANT' : 'PENDING_ADMIN';
        const action = 'APPROVED';

        const newStep = {
          stage: 'PENDING_HR',
          action,
          actorId: actor.userId,
          actorName,
          note: payload?.note || 'HR đã đối chứng hồ sơ hợp lệ',
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: nextStage,
          approvalSteps: [...existingSteps, newStep],
        };

        const updated = await tx.employeeRequest.update({
          where: { id },
          data: { attachmentMetadata: updatedMeta as Prisma.InputJsonValue },
        });

        if (nextStage === 'PENDING_ADMIN') {
          const adminUserIds = await this.findRelevantAdminUserIds(request.departmentId, tx);
          if (adminUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, adminUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn không VAT cần Ban Giám Đốc duyệt',
              body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) chuyển Ban Giám Đốc phê duyệt.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        } else {
          const accountantUserIds = await this.findAccountantUserIds(tx);
          if (accountantUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn chờ Kế toán thanh toán',
              body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) đã được xác nhận, chuyển Kế toán.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        }

        return updated;
      }

      // 3. Admin Approval stage (PENDING_ADMIN)
      if (currentStage === 'PENDING_ADMIN') {
        if (!isGlobalAdmin && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ Ban Giám Đốc hoặc Quản trị viên quản lý đơn từ thuộc miền của mình mới có quyền phê duyệt.');
        }

        if (isPurchase) {
          const nextStage = 'PENDING_HR_PURCHASE';
          const newStep = {
            stage: 'PENDING_ADMIN',
            action: 'DISBURSED_TO_HR',
            actorId: actor.userId,
            actorName: actorName || 'Ban Giám Đốc',
            note: payload?.note || 'Ban Giám Đốc đã duyệt và giải ngân tiền mua hàng cho HR',
            bankRefCode: payload?.bankRefCode,
            disbursementProofUrl: payload?.disbursementProofUrl,
            at: new Date().toISOString(),
          };

          const updatedMeta = {
            ...currentMeta,
            stage: nextStage,
            purchaseApproved: true,
            bankRefCode: payload?.bankRefCode || currentMeta.bankRefCode,
            disbursementProofUrl: payload?.disbursementProofUrl || currentMeta.disbursementProofUrl,
            adminApprovedAt: new Date().toISOString(),
            approvalSteps: [...existingSteps, newStep],
          };

          const updated = await tx.employeeRequest.update({
            where: { id },
            data: {
              attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
            },
          });

          // Thông báo cho HR tiến hành mua sắm
          const hrUserIds = await this.findHrUserIds(tx);
          if (hrUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, hrUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Ban Giám Đốc đã duyệt mua sắm 💰',
              body: `Ban Giám Đốc đã duyệt đơn "${request.title}". Tiền đã chuyển vào tài khoản HR. Mời HR tiến hành mua hàng.`,
              metadata: { requestId: id, disbursementProofUrl: payload?.disbursementProofUrl },
            });
            this.notifications.emitCreated(notif);
          }

          // Thông báo cho người tạo
          const notif = await this.notifications.createForUsers(tx, [request.userId], {
            type: NotificationType.SYSTEM,
            title: 'Đề xuất mua sắm đã được duyệt 📦',
            body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) đã được Ban Giám Đốc duyệt cấp kinh phí. HR đang tiến hành mua hàng.`,
            metadata: { requestId: id },
          });
          this.notifications.emitCreated(notif);

          return updated;
        }

        const nextStage = 'DISBURSED';

        const newStep = {
          stage: 'PENDING_ADMIN',
          action: 'DISBURSED',
          actorId: actor.userId,
          actorName: actorName || 'Ban Giám Đốc',
          note: payload?.note || 'Ban Giám Đốc đã duyệt và hoàn tất giải ngân',
          bankRefCode: payload?.bankRefCode,
          disbursementProofUrl: payload?.disbursementProofUrl,
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: nextStage,
          bankRefCode: payload?.bankRefCode || currentMeta.bankRefCode,
          disbursementProofUrl: payload?.disbursementProofUrl || currentMeta.disbursementProofUrl,
          approvalSteps: [...existingSteps, newStep],
        };

        const updated = await tx.employeeRequest.update({
          where: { id },
          data: {
            status: EmployeeRequestStatus.APPROVED,
            decidedByUserId: actor.userId,
            decidedAt: new Date(),
            attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
          },
        });

        // Thông báo cho người tạo là đã giải ngân thành công
        const notif = await this.notifications.createForUsers(tx, [request.userId], {
          type: NotificationType.SYSTEM,
          title: 'Đã thanh toán thành công 💸',
          body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) đã được Ban Giám Đốc duyệt và giải ngân thành công.`,
          metadata: { requestId: id, disbursementProofUrl: payload?.disbursementProofUrl },
        });
        this.notifications.emitCreated(notif);

        return updated;
      }

      // 4. Kế toán duyệt (PENDING_ACCOUNTANT / PENDING_DISBURSEMENT)
      if (currentStage === 'PENDING_ACCOUNTANT' || currentStage === 'PENDING_DISBURSEMENT') {
        const isAccLead = await this.isAccountantLeadActor(actor);
        if (!isAccLead && !isGlobalAdmin) {
          throw forbidden('FORBIDDEN', 'Chỉ Kế toán trưởng (Trưởng phòng Kế toán) hoặc Ban Giám Đốc mới có quyền phê duyệt bước này.');
        }

        // Nếu là đơn MUA HÀNG (PURCHASE)
        if (isPurchase) {
          if (payload?.forwardToAdmin) {
            const newStep = {
              stage: currentStage,
              action: 'FORWARD_ADMIN',
              actorId: actor.userId,
              actorName: actorName || 'Kế toán trưởng',
              note: payload?.note || 'Kế toán đã duyệt đề xuất mua hàng, chuyển Ban Giám Đốc phê duyệt',
              at: new Date().toISOString(),
            };

            const updatedMeta = {
              ...currentMeta,
              stage: 'PENDING_ADMIN',
              approvalSteps: [...existingSteps, newStep],
            };

            const updated = await tx.employeeRequest.update({
              where: { id },
              data: { attachmentMetadata: updatedMeta as Prisma.InputJsonValue },
            });

            const adminUserIds = await this.findRelevantAdminUserIds(request.departmentId, tx);
            if (adminUserIds.length > 0) {
              const notif = await this.notifications.createForUsers(tx, adminUserIds, {
                type: NotificationType.SYSTEM,
                title: 'Đề xuất mua sắm cần Ban Giám Đốc duyệt 🛒',
                body: `Kế toán đã chuyển Ban Giám Đốc duyệt đơn mua sắm "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ).`,
                metadata: { requestId: id },
              });
              this.notifications.emitCreated(notif);
            }

            return updated;
          }

          // Ngược lại: Kế toán duyệt & Giải ngân tiền mua sắm cho HR
          const newStep = {
            stage: currentStage,
            action: 'DISBURSED_TO_HR',
            actorId: actor.userId,
            actorName: actorName || 'Kế toán trưởng',
            note: payload?.note || 'Kế toán trưởng đã duyệt và giải ngân tiền mua hàng vào tài khoản HR',
            bankRefCode: payload?.bankRefCode,
            disbursementProofUrl: payload?.disbursementProofUrl,
            at: new Date().toISOString(),
          };

          const updatedMeta = {
            ...currentMeta,
            stage: 'PENDING_HR_PURCHASE',
            purchaseApproved: true,
            bankRefCode: payload?.bankRefCode || currentMeta.bankRefCode,
            disbursementProofUrl: payload?.disbursementProofUrl || currentMeta.disbursementProofUrl,
            accountantDisbursedAt: new Date().toISOString(),
            approvalSteps: [...existingSteps, newStep],
          };

          const updated = await tx.employeeRequest.update({
            where: { id },
            data: {
              attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
            },
          });

          // Tìm danh sách nhân sự HR để thông báo
          const hrUserIds = await this.findHrUserIds(tx);
          if (hrUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, hrUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Tiền mua sắm đã được giải ngân 💰',
              body: `Kế toán đã chuyển tiền cho đề xuất "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Mời HR kiểm tra tài khoản và tiến hành mua hàng.`,
              metadata: { requestId: id, disbursementProofUrl: payload?.disbursementProofUrl },
            });
            this.notifications.emitCreated(notif);
          }

          // Thông báo cho người đề xuất
          const notif = await this.notifications.createForUsers(tx, [request.userId], {
            type: NotificationType.SYSTEM,
            title: 'Đề xuất mua sắm đã được cấp ngân sách 📦',
            body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) đã được Kế toán duyệt cấp kinh phí. HR đang tiến hành mua hàng.`,
            metadata: { requestId: id },
          });
          this.notifications.emitCreated(notif);

          return updated;
        }

        // Nếu Kế toán chọn "Duyệt chờ thanh toán" -> Đẩy lên Ban Giám Đốc (cho ADVANCE / EXPENSE)
        if (payload?.forwardToAdmin) {
          const newStep = {
            stage: currentStage,
            action: 'FORWARD_ADMIN',
            actorId: actor.userId,
            actorName: actorName || 'Kế toán trưởng',
            note: payload?.note || 'Kế toán đã duyệt chờ thanh toán, chuyển Ban Giám Đốc phê duyệt',
            at: new Date().toISOString(),
          };

          const updatedMeta = {
            ...currentMeta,
            stage: 'PENDING_ADMIN',
            approvalSteps: [...existingSteps, newStep],
          };

          const updated = await tx.employeeRequest.update({
            where: { id },
            data: { attachmentMetadata: updatedMeta as Prisma.InputJsonValue },
          });

          const adminUserIds = await this.findRelevantAdminUserIds(request.departmentId, tx);
          if (adminUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, adminUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn thanh toán cần Ban Giám Đốc duyệt',
              body: `Kế toán đã duyệt chờ thanh toán đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Chuyển Ban Giám Đốc duyệt.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }

          return updated;
        }

        // Ngược lại: Kế toán duyệt & Giải ngân (Upload bill) -> DISBURSED / APPROVED
        const newStep = {
          stage: currentStage,
          action: 'DISBURSED',
          actorId: actor.userId,
          actorName: actorName || 'Kế toán trưởng',
          note: payload?.note || 'Kế toán trưởng đã phê duyệt và thanh toán / giải ngân thành công',
          bankRefCode: payload?.bankRefCode,
          disbursementProofUrl: payload?.disbursementProofUrl,
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: 'DISBURSED',
          bankRefCode: payload?.bankRefCode || currentMeta.bankRefCode,
          disbursementProofUrl: payload?.disbursementProofUrl,
          approvalSteps: [...existingSteps, newStep],
        };

        const updated = await tx.employeeRequest.update({
          where: { id },
          data: {
            status: EmployeeRequestStatus.APPROVED,
            decidedByUserId: actor.userId,
            decidedAt: new Date(),
            attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
          },
        });

        // Notify the creator that money has been disbursed!
        const notif = await this.notifications.createForUsers(tx, [request.userId], {
          type: NotificationType.SYSTEM,
          title: 'Đã thanh toán thành công 💸',
          body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) của bạn đã được Kế toán trưởng thanh toán thành công.`,
          metadata: { requestId: id, disbursementProofUrl: payload?.disbursementProofUrl },
        });
        this.notifications.emitCreated(notif);

        return updated;
      }

      throw badRequest('INVALID_STAGE', `Giai đoạn ${currentStage} không hợp lệ để duyệt`);
    });
  }

  async reject(id: string, actor: AuthenticatedUser, payload?: RejectEmployeeRequestDto) {
    if (!payload?.reason || !payload.reason.trim()) {
      throw badRequest('REJECTION_REASON_REQUIRED', 'Bắt buộc phải nhập lý do từ chối yêu cầu.');
    }

    const request = await this.prisma.employeeRequest.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!request) throw notFound('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');
    if (request.status !== EmployeeRequestStatus.PENDING) {
      throw badRequest('EMPLOYEE_REQUEST_NOT_PENDING', 'Yêu cầu không còn ở trạng thái chờ xử lý');
    }

    const isFinancial =
      request.type === EmployeeRequestType.ADVANCE ||
      request.type === EmployeeRequestType.EXPENSE ||
      request.type === EmployeeRequestType.PURCHASE;
    const isAccountant = await this.isAccountantActor(actor);
    const isHr = await this.isHrActor(actor);
    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !isRegionAdmin) || this.scope.isGlobalAdmin(actor);
    const canDeptAccess = request.departmentId ? await this.scope.canAccessDepartmentAsync(actor, request.departmentId) : false;

    if (!isFinancial) {
      if (!isGlobalAdmin && !isHr && !canDeptAccess) {
        throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền từ chối yêu cầu của phòng ban này');
      }
    } else {
      const currentMeta = (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null)
        ? { ...(request.attachmentMetadata as Record<string, any>) }
        : {};
      const currentStage = currentMeta.stage || 'PENDING';

      if (currentStage === 'PENDING_LEADER') {
        const isLeader = request.department?.leaderUserId === actor.userId || canDeptAccess;
        if (!isLeader && !isGlobalAdmin) {
          throw forbidden('FORBIDDEN', 'Chỉ Trưởng bộ phận hoặc Quản trị viên quản lý mới có quyền từ chối bước này.');
        }
      } else if (currentStage === 'PENDING_HR') {
        if (!isHr && !isGlobalAdmin && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ HR hoặc Quản trị viên mới có quyền từ chối bước này.');
        }
      } else if (currentStage === 'PENDING_ADMIN') {
        if (!isGlobalAdmin && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ Ban Giám Đốc hoặc Quản trị viên mới có quyền từ chối bước này.');
        }
      } else if (currentStage === 'PENDING_ACCOUNTANT' || currentStage === 'PENDING_DISBURSEMENT') {
        const isAccLead = await this.isAccountantLeadActor(actor);
        if (!isAccLead) {
          throw forbidden('FORBIDDEN', 'Chỉ Kế toán trưởng (Trưởng phòng Kế toán) hoặc Ban Giám Đốc mới có quyền từ chối bước này.');
        }
      }
    }

    const currentMeta = (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null)
      ? { ...(request.attachmentMetadata as Record<string, any>) }
      : {};
    const currentStage = currentMeta.stage || 'PENDING';
    const existingSteps = Array.isArray(currentMeta.approvalSteps) ? currentMeta.approvalSteps : [];

    const actorProfile = await this.prisma.employeeProfile.findUnique({ where: { userId: actor.userId } });
    const actorName = actorProfile?.fullName || (actor.roles.includes('ADMIN') ? 'Ban Giám Đốc' : isHr ? 'Trưởng phòng HR' : isAccountant ? 'Kế toán' : 'Trưởng bộ phận');

    const isPurchase = request.type === EmployeeRequestType.PURCHASE;
    const isAccountantOrAdmin = currentStage === 'PENDING_ACCOUNTANT' || currentStage === 'PENDING_DISBURSEMENT' || currentStage === 'PENDING_ADMIN';

    // Đề xuất mua sắm khi Kế toán hoặc Ban Giám Đốc từ chối (mặc định trả về HR để điều chỉnh/báo giá lại trừ khi chọn permanentReject)
    if (isPurchase && isAccountantOrAdmin && !payload.permanentReject) {
      const newStep = {
        stage: currentStage,
        action: 'REJECTED_TO_HR',
        actorId: actor.userId,
        actorName,
        reason: payload.reason.trim(),
        at: new Date().toISOString(),
      };

      const updatedMeta = {
        ...currentMeta,
        stage: 'REJECTED_TO_HR',
        rejectReason: payload.reason.trim(),
        rejectedAt: new Date().toISOString(),
        rejectedBy: actor.userId,
        approvalSteps: [...existingSteps, newStep],
      };

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.employeeRequest.update({
          where: { id },
          data: {
            attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
          },
        });

        // Thông báo cho HR xem xét và điều chỉnh lại
        const hrUserIds = await this.findHrUserIds(tx);
        if (hrUserIds.length > 0) {
          const notif = await this.notifications.createForUsers(tx, hrUserIds, {
            type: NotificationType.SYSTEM,
            title: 'Đề xuất mua hàng bị trả về HR ⚠️',
            body: `${actorName} đã từ chối duyệt đơn "${request.title}" và trả về HR điều chỉnh. Lý do: ${payload.reason.trim()}`,
            metadata: { requestId: id, reason: payload.reason.trim() },
          });
          this.notifications.emitCreated(notif);
        }

        // Thông báo cho người đề xuất
        const notif = await this.notifications.createForUsers(tx, [request.userId], {
          type: NotificationType.SYSTEM,
          title: 'Đề xuất mua sắm đang được HR xem xét lại',
          body: `Đơn "${request.title}" của bạn đang được Kế toán/BGĐ trả về HR để đối chứng hoặc điều chỉnh lại báo giá.`,
          metadata: { requestId: id },
        });
        this.notifications.emitCreated(notif);

        return updated;
      });
    }

    const newStep = {
      stage: currentStage,
      action: 'REJECTED',
      actorId: actor.userId,
      actorName,
      reason: payload.reason.trim(),
      at: new Date().toISOString(),
    };

    const updatedMeta = {
      ...currentMeta,
      stage: 'REJECTED',
      rejectReason: payload.reason.trim(),
      approvalSteps: [...existingSteps, newStep],
    };

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeRequest.update({
        where: { id },
        data: {
          status: EmployeeRequestStatus.REJECTED,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
          attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
        },
      });

      const notif = await this.notifications.createForUsers(tx, [request.userId], {
        type: NotificationType.SYSTEM,
        title: isPurchase ? 'Đề xuất mua sắm bị từ chối ❌' : 'Yêu cầu thanh toán bị từ chối ❌',
        body: `Đơn "${request.title}" của bạn đã bị từ chối bởi ${actorName}. Lý do: ${payload.reason.trim()}`,
        metadata: { requestId: id, reason: payload.reason.trim() },
      });
      this.notifications.emitCreated(notif);

      return updated;
    });
  }

  async resubmitPurchaseByHr(id: string, payload: ResubmitPurchaseByHrDto, actor: AuthenticatedUser) {
    const isHr = await this.isHrActor(actor);
    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !isRegionAdmin) || this.scope.isGlobalAdmin(actor);
    if (!isHr && !isGlobalAdmin) {
      throw forbidden('HR_ONLY', 'Chỉ nhân sự HR hoặc Quản trị viên mới có quyền điều chỉnh và trình lại đề xuất mua sắm.');
    }

    const request = await this.prisma.employeeRequest.findUnique({
      where: { id },
      include: {
        user: { select: { profile: { select: { fullName: true } } } },
        department: true,
      },
    });
    if (!request) throw notFound('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');
    if (request.type !== EmployeeRequestType.PURCHASE) {
      throw badRequest('INVALID_TYPE', 'Chức năng này chỉ áp dụng cho Đề xuất mua sắm (PURCHASE).');
    }

    const currentMeta = (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null)
      ? { ...(request.attachmentMetadata as Record<string, any>) }
      : {};
    const currentStage = currentMeta.stage || 'PENDING';

    if (currentStage !== 'REJECTED_TO_HR' && currentStage !== 'PENDING_HR') {
      throw badRequest('INVALID_STAGE', `Đơn đang ở giai đoạn ${currentStage}, không thể trình lại.`);
    }

    const actorProfile = await this.prisma.employeeProfile.findUnique({
      where: { userId: actor.userId },
      include: {
        bankAccounts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          take: 1,
        },
      },
    });
    const primaryBank = actorProfile?.bankAccounts?.[0];
    const actorName = actorProfile?.fullName || 'HR Phụ trách';
    const existingSteps = Array.isArray(currentMeta.approvalSteps) ? currentMeta.approvalSteps : [];

    const bankAccount = payload.bankAccount?.trim() || currentMeta.hrBank?.bankAccount || primaryBank?.accountNumber?.trim();
    const bankName = payload.bankName?.trim() || currentMeta.hrBank?.bankName || primaryBank?.bankName?.trim();
    const accountHolder = payload.accountHolder?.trim() || currentMeta.hrBank?.accountHolder || primaryBank?.accountName?.trim() || actorProfile?.fullName?.trim();

    if (!bankAccount || !bankName) {
      throw badRequest('HR_BANK_INFO_REQUIRED', 'Vui lòng cung cấp Số tài khoản và Tên ngân hàng nhận tiền.');
    }

    const hrBank = {
      bankAccount,
      bankName,
      accountHolder: accountHolder || 'HR Phụ trách',
    };

    const newAmount = payload.amount !== undefined && Number(payload.amount) > 0 ? Number(payload.amount) : Number(request.amount || 0);
    const explanationText = payload.explanation?.trim() || payload.note?.trim() || 'HR đã cập nhật báo giá / thông tin và trình lại Kế toán';
    const quoteList = payload.quoteUrls || payload.images;

    const newStep = {
      stage: currentStage,
      action: 'RESUBMITTED_BY_HR',
      actorId: actor.userId,
      actorName,
      note: explanationText,
      hrBank,
      amount: newAmount,
      quoteUrls: quoteList,
      at: new Date().toISOString(),
    };

    const updatedMeta = {
      ...currentMeta,
      stage: 'PENDING_ACCOUNTANT',
      hrBank,
      ...(quoteList ? { quoteUrls: quoteList } : {}),
      hrResubmittedAt: new Date().toISOString(),
      hrResubmittedBy: actor.userId,
      hrExplanation: explanationText,
      approvalSteps: [...existingSteps, newStep],
    };

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeRequest.update({
        where: { id },
        data: {
          amount: newAmount,
          attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
        },
      });

      const accountantUserIds = await this.findAccountantUserIds(tx);
      if (accountantUserIds.length > 0) {
        const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
          type: NotificationType.SYSTEM,
          title: 'Đề xuất mua sắm đã được HR trình lại 🛒',
          body: `HR đã điều chỉnh và trình lại đề xuất "${request.title}" (${newAmount.toLocaleString('vi-VN')} VNĐ). Mời Kế toán xem xét giải ngân.`,
          metadata: { requestId: id },
        });
        this.notifications.emitCreated(notif);
      }

      const reqNotif = await this.notifications.createForUsers(tx, [request.userId], {
        type: NotificationType.SYSTEM,
        title: 'Đề xuất mua sắm đã được trình lại 📄',
        body: `Đề xuất "${request.title}" đã được HR cập nhật thông tin và trình lại cho Kế toán giải ngân.`,
        metadata: { requestId: id },
      });
      this.notifications.emitCreated(reqNotif);

      return updated;
    });
  }

  async fulfillPurchaseByHr(id: string, payload: FulfillPurchaseByHrDto, actor: AuthenticatedUser) {
    const isHr = await this.isHrActor(actor);
    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !isRegionAdmin) || this.scope.isGlobalAdmin(actor);
    if (!isHr && !isGlobalAdmin) {
      throw forbidden('HR_ONLY', 'Chỉ nhân sự HR hoặc Quản trị viên mới có quyền hoàn tất mua hàng và bàn giao.');
    }

    const request = await this.prisma.employeeRequest.findUnique({
      where: { id },
      include: {
        user: { select: { profile: { select: { fullName: true } } } },
        department: true,
      },
    });
    if (!request) throw notFound('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');
    if (request.type !== EmployeeRequestType.PURCHASE) {
      throw badRequest('INVALID_TYPE', 'Chức năng này chỉ áp dụng cho Đề xuất mua sắm (PURCHASE).');
    }

    const currentMeta = (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null)
      ? { ...(request.attachmentMetadata as Record<string, any>) }
      : {};
    const currentStage = currentMeta.stage || 'PENDING';

    if (currentStage !== 'PENDING_HR_PURCHASE') {
      throw badRequest('INVALID_STAGE', `Đơn đang ở giai đoạn ${currentStage}, chưa thể hoàn tất mua sắm.`);
    }

    const actorProfile = await this.prisma.employeeProfile.findUnique({ where: { userId: actor.userId } });
    const actorName = actorProfile?.fullName || 'HR Phụ trách';
    const existingSteps = Array.isArray(currentMeta.approvalSteps) ? currentMeta.approvalSteps : [];

    const receiptUrls = payload.receiptUrls && payload.receiptUrls.length > 0
      ? payload.receiptUrls
      : (payload.receiptUrl ? [payload.receiptUrl] : (payload.images || []));
    const deliveryProofUrls = payload.deliveryProofUrls || [];

    const fulfillment = {
      receiptUrls,
      deliveryProofUrls,
      actualAmount: payload.actualAmount !== undefined ? Number(payload.actualAmount) : Number(request.amount || 0),
      note: payload.note?.trim() || 'HR đã mua hàng và bàn giao thành công',
      fulfilledAt: new Date().toISOString(),
      fulfilledBy: actor.userId,
      fulfilledByName: actorName,
    };

    const newStep = {
      stage: 'PENDING_HR_PURCHASE',
      action: 'PURCHASE_FULFILLED',
      actorId: actor.userId,
      actorName,
      note: fulfillment.note,
      fulfillment,
      at: new Date().toISOString(),
    };

    const updatedMeta = {
      ...currentMeta,
      stage: 'PURCHASE_FULFILLED',
      fulfillment,
      approvalSteps: [...existingSteps, newStep],
    };

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeRequest.update({
        where: { id },
        data: {
          status: EmployeeRequestStatus.APPROVED,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
          attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
        },
      });

      // Thông báo cho người đề xuất (kèm thông báo bàn giao thành công)
      const reqNotif = await this.notifications.createForUsers(tx, [request.userId], {
        type: NotificationType.SYSTEM,
        title: 'Mua sắm & Bàn giao thành công 🎉',
        body: `Đề xuất mua sắm "${request.title}" đã được HR mua hàng và hoàn tất bàn giao. Vui lòng kiểm tra và tiếp nhận sản phẩm!`,
        metadata: {
          requestId: id,
          receiptUrls,
          deliveryProofUrls,
        },
      });
      this.notifications.emitCreated(reqNotif);

      // Thông báo cho Kế toán biết việc mua sắm đã hoàn tất (kèm hóa đơn chứng từ)
      const accountantUserIds = await this.findAccountantUserIds(tx);
      if (accountantUserIds.length > 0) {
        const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
          type: NotificationType.SYSTEM,
          title: 'Đề xuất mua sắm đã hoàn tất mua hàng 🧾',
          body: `HR đã hoàn tất mua hàng cho đơn "${request.title}" và tải lên chứng từ/hóa đơn.`,
          metadata: { requestId: id },
        });
        this.notifications.emitCreated(notif);
      }

      return updated;
    });
  }

  private departmentFilter(
    requestedDepartmentId: string | undefined,
    visibleDepartmentIds: string[] | null,
  ): string | Prisma.StringFilter<'EmployeeRequest'> | undefined {
    if (visibleDepartmentIds === null) return requestedDepartmentId;
    if (requestedDepartmentId) {
      return visibleDepartmentIds.includes(requestedDepartmentId)
        ? requestedDepartmentId
        : { in: ['00000000-0000-0000-0000-000000000000'] };
    }
    return { in: visibleDepartmentIds.length ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'] };
  }

  private assertFinancialRequest(dto: CreateEmployeeRequestDto): void {
    const financialTypes = new Set<EmployeeRequestType>([
      EmployeeRequestType.ADVANCE,
      EmployeeRequestType.EXPENSE,
    ]);
    if (financialTypes.has(dto.type) && (dto.amount === undefined || dto.amount <= 0)) {
      throw badRequest('EMPLOYEE_REQUEST_AMOUNT_REQUIRED', 'Yêu cầu tài chính phải có số tiền hợp lệ');
    }
  }

  private async isAccountantActor(actor: AuthenticatedUser): Promise<boolean> {
    if (this.scope.isRegionAdmin(actor)) return false;
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !this.scope.isRegionAdmin(actor)) || this.scope.isGlobalAdmin(actor);
    const accountantRoleCodes = [
      'ACCOUNTANT',
      'ACCOUNTANT_LEAD',
      'ACCOUNTANT_PAYROLL',
      'ACCOUNTANT_TAX',
      'ACCOUNTANT_GENERAL',
      'ACCOUNTING',
      'ACC',
      'DIRECTOR',
    ];
    if (isGlobalAdmin || actor.roles.some((r) => accountantRoleCodes.includes(r.toUpperCase()))) {
      return true;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        ledDepartments: {
          select: { name: true, code: true },
        },
        departmentLinks: {
          select: { department: { select: { name: true, code: true } } },
        },
      },
    });
    if (!user) return false;
    const isLed = user.ledDepartments.some(
      (d) =>
        d.name.toLowerCase().includes('kế toán') ||
        d.name.toLowerCase().includes('tài chính') ||
        ['KT', 'TC', 'ACC', 'ACCOUNTING'].includes(d.code?.toUpperCase() || ''),
    );
    if (isLed) return true;
    const isMember = user.departmentLinks.some(
      (l) =>
        l.department.name.toLowerCase().includes('kế toán') ||
        l.department.name.toLowerCase().includes('tài chính') ||
        ['KT', 'TC', 'ACC', 'ACCOUNTING'].includes(l.department.code?.toUpperCase() || ''),
    );
    return isMember;
  }

  async isAccountingLeaderOnly(actor: AuthenticatedUser): Promise<boolean> {
    if (this.scope.isRegionAdmin(actor)) return false;

    // 1. Kiểm tra roles chuyên biệt cho Trưởng phòng Kế toán
    const normalizedRoles = (actor.roles || []).map((r) => r.toUpperCase());
    const isLeadRole = normalizedRoles.some((r) =>
      [
        'ACCOUNTANT_LEAD',
        'CHIEF_ACCOUNTANT',
        'KT_TRUONG',
        'LEAD_ACCOUNTANT',
        'TRUONG_PHONG_KE_TOAN',
        'TP_KETOAN',
        'TP_KE_TOAN',
      ].includes(r),
    );
    if (isLeadRole) {
      return true;
    }

    // 2. Query thông tin người dùng từ DB (phòng ban lãnh đạo & chức vụ)
    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        ledDepartments: {
          select: { name: true, code: true },
        },
        profile: {
          select: {
            position: {
              select: { name: true, code: true },
            },
          },
        },
      },
    });

    if (!user) return false;

    // 3. Chức danh (Position) là Kế toán trưởng hoặc Trưởng phòng kế toán / tài chính
    const posName = user.profile?.position?.name?.toLowerCase() || '';
    const posCode = user.profile?.position?.code?.toUpperCase() || '';
    const isChiefPosition =
      posName.includes('kế toán trưởng') ||
      posName.includes('trưởng phòng kế toán') ||
      posName.includes('trưởng ban tài chính') ||
      posName.includes('lead kế toán') ||
      posName.includes('trưởng nhóm kế toán') ||
      ['KTT', 'KT_TRUONG', 'TP_KT', 'ACCOUNTANT_LEAD', 'CHIEF_ACCOUNTANT'].includes(posCode);

    if (isChiefPosition) {
      return true;
    }

    // 4. Lãnh đạo (Leader) phòng ban Kế toán/Tài chính
    const leadsAccountingDept = (user.ledDepartments || []).some((d) => {
      const dName = d.name.toLowerCase();
      const dCode = d.code?.toUpperCase() || '';
      return (
        dName.includes('kế toán') ||
        dName.includes('tài chính') ||
        ['KT', 'TC', 'ACC', 'ACCOUNTING'].includes(dCode)
      );
    });

    return leadsAccountingDept;
  }

  private async isAccountantLeadActor(actor: AuthenticatedUser): Promise<boolean> {
    return this.isAccountingLeaderOnly(actor);
  }

  private async isHrActor(actor: AuthenticatedUser): Promise<boolean> {
    if (this.scope.isRegionAdmin(actor)) return false;
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !this.scope.isRegionAdmin(actor)) || this.scope.isGlobalAdmin(actor);
    if (isGlobalAdmin || actor.roles.some((r) => ['HR', 'HUMAN_RESOURCE', 'HR_MANAGER', 'DIRECTOR'].includes(r))) {
      return true;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        ledDepartments: {
          select: { name: true, code: true },
        },
        departmentLinks: {
          select: { department: { select: { name: true, code: true } } },
        },
      },
    });
    if (!user) return false;
    const isLed = user.ledDepartments.some(
      (d) =>
        d.name.toLowerCase().includes('nhân sự') ||
        d.name.toLowerCase().includes('hr') ||
        ['HR', 'NS', 'NHAN_SU'].includes(d.code?.toUpperCase() || ''),
    );
    if (isLed) return true;
    const isMember = user.departmentLinks.some(
      (l) =>
        l.department.name.toLowerCase().includes('nhân sự') ||
        l.department.name.toLowerCase().includes('hr') ||
        ['HR', 'NS', 'NHAN_SU'].includes(l.department.code?.toUpperCase() || ''),
    );
    return isMember;
  }

  private async findAccountantUserIds(tx: Prisma.TransactionClient | PrismaService): Promise<string[]> {
    const users = await tx.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        OR: [
          { roles: { some: { role: { code: { in: ['ACCOUNTANT', 'ACCOUNTING', 'ACC'] } } } } },
          { ledDepartments: { some: { name: { contains: 'Kế toán', mode: 'insensitive' } } } },
          { ledDepartments: { some: { name: { contains: 'Tài chính', mode: 'insensitive' } } } },
          { ledDepartments: { some: { code: { in: ['KT', 'TC', 'ACC', 'ACCOUNTING'] } } } },
          { departmentLinks: { some: { department: { name: { contains: 'Kế toán', mode: 'insensitive' } } } } },
        ],
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async findHrUserIds(tx: Prisma.TransactionClient | PrismaService): Promise<string[]> {
    const users = await tx.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        OR: [
          { roles: { some: { role: { code: { in: ['HR', 'HUMAN_RESOURCE', 'HR_MANAGER'] } } } } },
          { ledDepartments: { some: { name: { contains: 'Nhân sự', mode: 'insensitive' } } } },
          { ledDepartments: { some: { name: { contains: 'HR', mode: 'insensitive' } } } },
          { ledDepartments: { some: { code: { in: ['HR', 'NS', 'NHAN_SU'] } } } },
          { departmentLinks: { some: { department: { name: { contains: 'Nhân sự', mode: 'insensitive' } } } } },
        ],
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async findRelevantAdminUserIds(
    departmentId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<string[]> {
    const dept = await tx.department.findUnique({
      where: { id: departmentId },
      select: { branch: { select: { regionId: true } } },
    });
    const regionId = dept?.branch?.regionId;

    const admins = await tx.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        roles: {
          some: {
            role: { code: { in: ['ADMIN', 'DIRECTOR', 'GIAM_DOC'] } },
            OR: [
              { scopeType: RoleScopeType.GLOBAL },
              { scopeId: null },
              ...(regionId ? [{ scopeType: RoleScopeType.REGION, scopeId: regionId }] : []),
            ],
          },
        },
      },
      select: { id: true },
    });

    return admins.map((a) => a.id);
  }

  async exportDailyTransactions(query: ExportTransactionsQueryDto, actor: AuthenticatedUser) {
    const isAccountingLead = await this.isAccountingLeaderOnly(actor);
    if (!isAccountingLead) {
      throw forbidden(
        'FINANCIAL_EXPORT_ACCOUNTANT_LEAD_ONLY',
        'Chỉ có duy nhất Trưởng phòng Kế toán mới có quyền xuất Excel tài chính.',
      );
    }

    // Xử lý khoảng thời gian (theo ngày hoặc từ ngày - đến ngày hoặc Tất cả)
    let dateFilter: Prisma.DateTimeFilter | undefined = undefined;
    if (query.date && query.date !== 'ALL') {
      const startOfDay = new Date(`${query.date}T00:00:00.000+07:00`);
      const endOfDay = new Date(`${query.date}T23:59:59.999+07:00`);
      dateFilter = { gte: startOfDay, lte: endOfDay };
    } else if (query.fromDate && query.toDate) {
      const startOfDay = new Date(`${query.fromDate}T00:00:00.000+07:00`);
      const endOfDay = new Date(`${query.toDate}T23:59:59.999+07:00`);
      dateFilter = { gte: startOfDay, lte: endOfDay };
    } else if (query.fromDate) {
      dateFilter = { gte: new Date(`${query.fromDate}T00:00:00.000+07:00`) };
    } else if (query.toDate) {
      dateFilter = { lte: new Date(`${query.toDate}T23:59:59.999+07:00`) };
    }

    const financialTypes = [EmployeeRequestType.EXPENSE, EmployeeRequestType.ADVANCE, EmployeeRequestType.PURCHASE];
    let typeFilter: any = { in: financialTypes };
    if (query.type && query.type !== 'ALL') {
      typeFilter = query.type as EmployeeRequestType;
    }

    const where: Prisma.EmployeeRequestWhereInput = {
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      type: typeFilter,
      ...(query.status && query.status !== 'ALL' ? { status: query.status as EmployeeRequestStatus } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    };

    const requests = await this.prisma.employeeRequest.findMany({
      where,
      include: {
        user: {
          select: {
            userCode: true,
            email: true,
            phone: true,
            profile: {
              select: {
                fullName: true,
                bankAccounts: {
                  select: {
                    bankName: true,
                    accountNumber: true,
                    accountName: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Lọc theo VAT nếu có tùy chọn
    const filteredRequests = requests.filter((r) => {
      const meta = (typeof r.attachmentMetadata === 'object' && r.attachmentMetadata !== null)
        ? (r.attachmentMetadata as Record<string, any>)
        : {};
      const hasVat = Boolean(meta.hasVat);
      if (query.vatOption === 'WITH_VAT') return hasVat;
      if (query.vatOption === 'NO_VAT') return !hasVat;
      return true;
    });

    // Tạo file Excel với ExcelJS
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Movie Legend HRM';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Đề Xuất Mua Hàng & Kế Toán', {
      views: [{ showGridLines: true }],
    });

    // Header bảng lớn
    worksheet.mergeCells('A1:M1');
    const mainHeader = worksheet.getCell('A1');
    mainHeader.value = 'Đề xuất mua hàng HCNS & Kế toán theo dõi';
    mainHeader.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF000000' } };
    mainHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    mainHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB4C6E7' }, // Xanh lam nhạt giống trong ảnh mẫu
    };
    worksheet.getRow(1).height = 36;

    // Dòng tiêu đề 13 cột (Row 2)
    const headerRow = worksheet.addRow([
      'Ngày',
      'Người đề xuất',
      'Trưởng bộ phận\nđề xuất',
      'Nội dung đề xuất',
      'Xác nhận đề\nxuất',
      'Số tiền theo\nhóa đơn',
      'Hóa đơn\nVAT',
      'Trạng thái',
      'Người cập\nnhật',
      'Ghi chú',
      'Công ty',
      'Kế Toán\nCheck',
      'Chứng từ / Bill\nđính kèm',
    ]);

    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 32;

    headerRow.eachCell((cell: any) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' }, // Xanh lá pastel nhạt như tiêu đề bảng mẫu
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF548235' } },
        left: { style: 'thin', color: { argb: 'FF548235' } },
        bottom: { style: 'thin', color: { argb: 'FF548235' } },
        right: { style: 'thin', color: { argb: 'FF548235' } },
      };
    });

    const getImageBufferAndExt = async (rawUrl: string): Promise<{ buffer: Buffer; extension: 'jpeg' | 'png' | 'gif' } | null> => {
      try {
        if (!rawUrl || typeof rawUrl !== 'string') return null;
        const clean = rawUrl.trim();

        if (clean.includes('/uploads/') || clean.startsWith('uploads/') || clean.startsWith('/storage/') || clean.startsWith('storage/')) {
          const relativePart = clean.replace(/^.*\/uploads\//, '').replace(/^.*\/storage\//, '').replace(/^\/+/, '');
          const localPath = path.resolve(process.cwd(), 'storage', relativePart);
          if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath);
            const ext = relativePart.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
            return { buffer: buf, extension: ext };
          }
        }

        if (clean.startsWith('http://') || clean.startsWith('https://')) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const response = await fetch(clean, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            const arrayBuf = await response.arrayBuffer();
            const buf = Buffer.from(arrayBuf);
            const ext = clean.toLowerCase().includes('.png') ? 'png' : 'jpeg';
            return { buffer: buf, extension: ext };
          }
        }
      } catch {
        // Fallback silently if image cannot be read/downloaded
      }
      return null;
    };

    let totalAmount = 0;
    for (const req of filteredRequests) {
      const meta = (typeof req.attachmentMetadata === 'object' && req.attachmentMetadata !== null)
        ? (req.attachmentMetadata as Record<string, any>)
        : {};
      const amountNum = Number(req.amount || 0);
      totalAmount += amountNum;

      const hasVat = Boolean(meta.hasVat);
      const reqAny = req as any;
      const deptName = reqAny.department?.name || 'HCNS';
      const submitterName = reqAny.user?.profile?.fullName || reqAny.user?.userCode || 'Nhân viên';
      
      // Tìm tên Trưởng bộ phận duyệt bước 1 nếu có
      const leaderStep = Array.isArray(meta.approvalSteps)
        ? meta.approvalSteps.find((s: any) => s.stage === 'PENDING_LEADER' || s.action === 'APPROVED')
        : null;
      const leaderName = leaderStep?.actorName || reqAny.department?.leader?.profile?.fullName || reqAny.department?.leader?.userCode || submitterName;

      // 1. Ngày
      const reqDate = new Date(req.createdAt);
      const formattedDate = `${String(reqDate.getDate()).padStart(2, '0')}/${String(reqDate.getMonth() + 1).padStart(2, '0')}/${reqDate.getFullYear()}`;

      // 5. Xác nhận đề xuất
      const confirmDept = deptName.toUpperCase().includes('NHÂN SỰ') || deptName.toUpperCase().includes('HR') || deptName.toUpperCase().includes('HCNS')
        ? 'HCNS'
        : deptName;

      // 7. Hóa đơn VAT
      let vatStatus = hasVat ? 'Hoàn tất' : 'Không có VAT';
      if (meta.vatStatus) vatStatus = meta.vatStatus;
      else if (hasVat && req.status === EmployeeRequestStatus.PENDING) vatStatus = 'Đang xử lý';

      // 8. Trạng thái
      let statusText = 'Đang xử lý';
      if (req.status === EmployeeRequestStatus.APPROVED || meta.stage === 'DISBURSED') statusText = 'Đã thanh toán';
      else if (req.status === EmployeeRequestStatus.REJECTED) statusText = 'Đã từ chối';

      // 9. Người cập nhật
      const lastStep = Array.isArray(meta.approvalSteps) && meta.approvalSteps.length > 0
        ? meta.approvalSteps[meta.approvalSteps.length - 1]
        : null;
      const updatedBy = meta.purchasedByHrName || lastStep?.actorName || 'Th thủy';

      // 10. Ghi chú
      let noteText = meta.note || (hasVat ? 'Đã về hóa đơn' : 'Không có hóa đơn');
      if (meta.vatStatus === 'Chưa về hóa đơn') noteText = 'chưa về hóa đơn';
      if (meta.rejectReason) noteText = `Từ chối: ${meta.rejectReason}`;

      // 11. Công ty
      const companyName = deptName.toLowerCase().includes('tech') ? 'Movie Tech' : 'MovieLegend';

      // 12. Kế toán check
      const accountantCheck = req.status === EmployeeRequestStatus.APPROVED ? 'ok' : 'Chờ check';

      // 13. Chứng từ / Bill đính kèm
      let rawBillUrl: string | null =
        meta.disbursementProofUrl ||
        (Array.isArray(meta.images) && meta.images.length > 0 ? meta.images[0] : null) ||
        meta.image ||
        meta.imageUrl ||
        meta.billProofUrl ||
        meta.proofUrl ||
        meta.transferProofUrl ||
        (Array.isArray(meta.files) && meta.files.length > 0 ? meta.files[0] : null) ||
        null;

      if (!rawBillUrl && Array.isArray(meta.approvalSteps)) {
        for (const step of meta.approvalSteps) {
          if (step.disbursementProofUrl) {
            rawBillUrl = step.disbursementProofUrl;
            break;
          }
          if (step.proofUrl) {
            rawBillUrl = step.proofUrl;
            break;
          }
        }
      }

      let billProofUrl: string | null = null;
      if (rawBillUrl && typeof rawBillUrl === 'string' && rawBillUrl.trim().length > 0) {
        const cleanUrl = rawBillUrl.trim();
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
          billProofUrl = cleanUrl;
        } else {
          const rawBase =
            process.env.PUBLIC_API_URL ||
            process.env.API_URL ||
            process.env.APP_URL ||
            process.env.BACKEND_URL ||
            'http://180.93.165.243:3000';
          const baseUrl = rawBase.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');
          const normalizedPath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
          billProofUrl = `${baseUrl}${normalizedPath}`;
        }
      }

      const row = worksheet.addRow([
        formattedDate,
        submitterName,
        leaderName,
        req.title + (req.content ? ` - ${req.content}` : ''),
        confirmDept,
        amountNum,
        vatStatus,
        statusText,
        updatedBy,
        noteText,
        companyName,
        accountantCheck,
        '',
      ]);

      row.font = { name: 'Arial', size: 9.5 };
      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).numFmt = '#,##0';
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(7).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Đang xử lý, Hoàn tất, Chưa về hóa đơn, Không có VAT"'],
      };

      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(8).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Đã thanh toán, Đang xử lý, Chờ thanh toán, Đã từ chối"'],
      };

      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(12).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"ok, Chờ check"'],
      };
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

      let billImageEmbedded = false;
      if (rawBillUrl) {
        const imgData = await getImageBufferAndExt(rawBillUrl);
        if (imgData) {
          try {
            const imageId = workbook.addImage({
              buffer: imgData.buffer as any,
              extension: imgData.extension,
            });
            const cellRange = `M${row.number}:M${row.number}`;
            worksheet.addImage(imageId, cellRange);
            billImageEmbedded = true;
            row.height = 95;
          } catch {
            // fallback
          }
        }
      }

      if (billImageEmbedded) {
        // Ảnh đã hiển thị trực tiếp trong ô, không để text để tránh bị chữ đè lên ảnh
        row.getCell(13).value = '';
      } else if (billProofUrl) {
        row.getCell(13).value = {
          text: 'Xem ảnh Bill 🔗',
          hyperlink: billProofUrl,
          tooltip: 'Bấm để xem ảnh chứng từ / Bill chuyển khoản',
        };
        row.getCell(13).font = { name: 'Arial', size: 9.5, color: { argb: 'FF0563C1' }, underline: true };
      } else {
        row.getCell(13).value = 'Không có bill';
        row.getCell(13).font = { name: 'Arial', size: 9.5, color: { argb: 'FF7F7F7F' } };
      }

      // Badge style cho Trạng thái
      if (statusText === 'Đã thanh toán') {
        row.getCell(8).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC00000' }, // Nền đỏ đậm
        };
        row.getCell(8).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      }

      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        };
      });
    }

    // Dòng tổng cộng
    const totalRow = worksheet.addRow([
      'Tổng cộng',
      '',
      '',
      `${filteredRequests.length} khoản chi`,
      '',
      totalAmount,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number}`);
    totalRow.font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(6).numFmt = '#,##0" đ"';
    totalRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
    totalRow.eachCell((cell: any) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF808080' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'medium', color: { argb: 'FF808080' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
    });

    // Độ rộng các cột
    worksheet.columns = [
      { width: 14 }, // 1. Ngày
      { width: 22 }, // 2. Người đề xuất
      { width: 22 }, // 3. Trưởng bộ phận đề xuất
      { width: 38 }, // 4. Nội dung đề xuất
      { width: 16 }, // 5. Xác nhận đề xuất
      { width: 18 }, // 6. Số tiền theo hóa đơn
      { width: 16 }, // 7. Hóa đơn VAT
      { width: 18 }, // 8. Trạng thái
      { width: 18 }, // 9. Người cập nhật
      { width: 24 }, // 10. Ghi chú
      { width: 16 }, // 11. Công ty
      { width: 14 }, // 12. Kế Toán Check
      { width: 35 }, // 13. Chứng từ / Bill đính kèm
    ];

    const dateLabel = query.date || (query.fromDate && query.toDate ? `${query.fromDate}-den-${query.toDate}` : new Date().toISOString().split('T')[0]);
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      filename: `De-xuat-mua-hang-HCNS-Ke-toan-theo-doi-${dateLabel}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(buffer),
    };
  }

  async createExpenseFromPurchase(
    purchaseRequestId: string,
    payload: CreateExpenseFromPurchaseDto,
    actor: AuthenticatedUser,
  ) {
    const isHr = actor.roles.includes('HR') || actor.roles.includes('ADMIN');
    if (!isHr) {
      throw forbidden('FORBIDDEN', 'Chỉ nhân sự (HR) hoặc Ban Quản Trị mới có quyền thực hiện mua hàng và tạo yêu cầu thanh toán.');
    }

    const purchaseReq = await this.prisma.employeeRequest.findUnique({
      where: { id: purchaseRequestId },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
        department: { select: { id: true, name: true, leaderUserId: true } },
      },
    });

    if (!purchaseReq) {
      throw badRequest('NOT_FOUND', 'Không tìm thấy đề xuất mua hàng.');
    }

    if (purchaseReq.type !== EmployeeRequestType.PURCHASE) {
      throw badRequest('INVALID_TYPE', 'Đơn này không phải là đề xuất mua hàng.');
    }

    const hrProfile = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { userCode: true, profile: { select: { fullName: true } } },
    });
    const hrName = hrProfile?.profile?.fullName || hrProfile?.userCode || 'HR';
    const requesterName = purchaseReq.user?.profile?.fullName || purchaseReq.user?.userCode || 'Nhân viên';

    return this.prisma.$transaction(async (tx) => {
      const amountVal = Number(payload.amount || 0);
      const hasVat = Boolean(payload.hasVat);

      // Tạo đơn thanh toán (EXPENSE) mới với userId là người yêu cầu mua hàng ban đầu
      const newExpense = await tx.employeeRequest.create({
        data: {
          userId: purchaseReq.userId, // Tên người yêu cầu mua ban đầu
          departmentId: purchaseReq.departmentId,
          type: EmployeeRequestType.EXPENSE,
          title: `[Thanh toán mua hàng] ${purchaseReq.title}`,
          content: payload.note ? `${purchaseReq.content || ''}\n(HR ghi chú: ${payload.note})`.trim() : purchaseReq.content,
          amount: amountVal,
          attachmentMetadata: {
            purchaseRequestId: purchaseReq.id,
            purchasedByHrId: actor.userId,
            purchasedByHrName: hrName,
            requesterName,
            hasVat,
            bankAccount: payload.bankAccount,
            bankName: payload.bankName,
            accountHolder: payload.accountHolder,
            images: payload.images || (payload.disbursementProofUrl ? [payload.disbursementProofUrl] : []),
            disbursementProofUrl: payload.disbursementProofUrl,
            stage: 'PENDING_ACCOUNTANT',
            approvalSteps: [
              {
                stage: 'PURCHASE_FULFILLED_BY_HR',
                action: 'PURCHASED_AND_REQUESTED_PAYMENT',
                actorId: actor.userId,
                actorName: hrName,
                note: payload.note || `HR (${hrName}) đã mua hàng xong và tạo yêu cầu thanh toán hoàn tiền.`,
                disbursementProofUrl: payload.disbursementProofUrl,
                at: new Date().toISOString(),
              },
            ],
          } as Prisma.InputJsonValue,
        },
      });

      // Cập nhật trạng thái đơn mua hàng ban đầu
      const purchaseMeta = (typeof purchaseReq.attachmentMetadata === 'object' && purchaseReq.attachmentMetadata !== null)
        ? { ...(purchaseReq.attachmentMetadata as Record<string, any>) }
        : {};
      const purchaseSteps = Array.isArray(purchaseMeta.approvalSteps) ? purchaseMeta.approvalSteps : [];

      purchaseSteps.push({
        stage: 'PENDING_HR_PURCHASE',
        action: 'FULFILLED',
        actorId: actor.userId,
        actorName: hrName,
        note: `HR (${hrName}) đã hoàn tất mua sắm và tạo đơn thanh toán #${newExpense.id.slice(0, 8)}.`,
        at: new Date().toISOString(),
      });

      await tx.employeeRequest.update({
        where: { id: purchaseReq.id },
        data: {
          status: EmployeeRequestStatus.APPROVED,
          attachmentMetadata: {
            ...purchaseMeta,
            stage: 'PURCHASE_FULFILLED',
            expenseRequestId: newExpense.id,
            purchasedByHrId: actor.userId,
            purchasedByHrName: hrName,
            approvalSteps: purchaseSteps,
          } as Prisma.InputJsonValue,
        },
      });

      // Thông báo cho Kế toán để thanh toán đơn mới tạo
      const accountantUserIds = await this.findAccountantUserIds(tx);
      if (accountantUserIds.length > 0) {
        const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
          type: NotificationType.SYSTEM,
          title: 'Đơn thanh toán mua hàng từ HR 💸',
          body: `HR ${hrName} đã mua hàng cho ${requesterName} và gửi yêu cầu thanh toán "${newExpense.title}" (${amountVal.toLocaleString('vi-VN')} VNĐ).`,
          metadata: { requestId: newExpense.id },
        });
        this.notifications.emitCreated(notif);
      }

      // Thông báo cho nhân viên yêu cầu mua hàng ban đầu
      const requesterNotif = await this.notifications.createForUsers(tx, [purchaseReq.userId], {
        type: NotificationType.SYSTEM,
        title: 'Đơn mua hàng đã được HR thực hiện 🛒',
        body: `HR ${hrName} đã hoàn tất mua hàng cho đơn "${purchaseReq.title}" và đang chuyển Kế toán thanh toán.`,
        metadata: { requestId: newExpense.id },
      });
      this.notifications.emitCreated(requesterNotif);

      return newExpense;
    });
  }

  async importPaymentFile(
    fileBuffer: Buffer | null,
    batchData: ImportPaymentBatchDto | null,
    actor: AuthenticatedUser,
  ) {
    const isAccountant = await this.isAccountantActor(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !this.scope.isRegionAdmin(actor)) || this.scope.isGlobalAdmin(actor);
    if (!isAccountant && !isGlobalAdmin) {
      throw forbidden('FORBIDDEN', 'Chỉ Kế toán hoặc Quản trị viên mới có quyền đẩy file thanh toán.');
    }

    let items: ImportPaymentItemDto[] = [];
    if (batchData?.items && batchData.items.length > 0) {
      items = batchData.items;
    } else if (fileBuffer) {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row: any, rowNumber: number) => {
        if (rowNumber <= 4) return; // Bỏ qua header
        const cell2 = row.getCell(2).value;
        const cell1 = row.getCell(1).value;
        let idVal = '';
        if (cell2 && typeof cell2 === 'string' && cell2.trim().length >= 4) {
          idVal = cell2.trim();
        } else if (cell1 && typeof cell1 === 'string' && cell1.trim().length >= 4) {
          idVal = cell1.trim();
        }

        const amountCell = row.getCell(9).value || row.getCell(8).value || row.getCell(3).value;
        const amountNum = typeof amountCell === 'number' ? amountCell : parseFloat(String(amountCell || '0').replace(/[^0-9.-]+/g, ''));
        const statusVal = String(row.getCell(15).value || row.getCell(14).value || 'SUCCESS');
        const refCode = String(row.getCell(17).value || row.getCell(16).value || '');
        const note = String(row.getCell(16).value || row.getCell(8).value || '');

        if (idVal && idVal !== 'STT' && idVal !== 'Tổng cộng') {
          items.push({
            requestId: idVal,
            amount: isNaN(amountNum) ? undefined : amountNum,
            status: statusVal.toUpperCase().includes('FAIL') || statusVal.toUpperCase().includes('TỪ CHỐI') ? 'FAILED' : 'SUCCESS',
            bankRefCode: refCode || undefined,
            note: note || undefined,
          });
        }
      });
    }

    if (items.length === 0) {
      throw badRequest('EMPTY_PAYMENT_FILE', 'File thanh toán không chứa dữ liệu giao dịch hợp lệ');
    }

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const results: any[] = [];

    const actorProfile = await this.prisma.employeeProfile.findUnique({
      where: { userId: actor.userId },
      select: { fullName: true },
    });
    const accountantDisplayName = actorProfile?.fullName ? `${actorProfile.fullName} (Kế toán)` : 'Kế toán';

    for (const item of items) {
      if (!item.requestId) continue;
      const cleanId = item.requestId.trim();

      let req = null;
      if (cleanId.length === 36) {
        req = await this.prisma.employeeRequest.findUnique({ where: { id: cleanId } });
      } else {
        const potentialRequests = await this.prisma.employeeRequest.findMany({
          where: {
            type: { in: [EmployeeRequestType.EXPENSE, EmployeeRequestType.ADVANCE, EmployeeRequestType.PURCHASE] },
          },
          take: 300,
          orderBy: { createdAt: 'desc' },
        });
        req = potentialRequests.find((r) => r.id.toLowerCase().startsWith(cleanId.toLowerCase())) || null;
      }

      if (!req) {
        failedCount++;
        results.push({ requestId: cleanId, status: 'FAILED', message: 'Không tìm thấy yêu cầu' });
        continue;
      }

      if (req.status === EmployeeRequestStatus.APPROVED) {
        skippedCount++;
        results.push({ requestId: req.id, status: 'SKIPPED', message: 'Đơn đã được thanh toán trước đó' });
        continue;
      }

      if (req.status === EmployeeRequestStatus.REJECTED) {
        skippedCount++;
        results.push({ requestId: req.id, status: 'SKIPPED', message: 'Đơn đã bị từ chối' });
        continue;
      }

      if (item.status === 'FAILED') {
        failedCount++;
        results.push({ requestId: req.id, status: 'FAILED', message: item.note || 'Thất bại theo kết quả ngân hàng' });
        continue;
      }

      const meta = (typeof req.attachmentMetadata === 'object' && req.attachmentMetadata !== null)
        ? { ...(req.attachmentMetadata as Record<string, any>) }
        : {};
      const existingSteps = Array.isArray(meta.approvalSteps) ? meta.approvalSteps : [];

      const newStep = {
        stage: 'DISBURSED',
        action: 'DISBURSED',
        actorId: actor.userId,
        actorName: accountantDisplayName,
        note: item.note || (item.bankRefCode ? `Đã thanh toán ngân hàng (Mã GD: ${item.bankRefCode})` : 'Đã thanh toán qua đẩy file tt'),
        bankRefCode: item.bankRefCode,
        at: new Date().toISOString(),
      };

      const updatedMeta = {
        ...meta,
        stage: 'DISBURSED',
        bankRefCode: item.bankRefCode,
        paymentImportedAt: new Date().toISOString(),
        approvalSteps: [...existingSteps, newStep],
      };

      await this.prisma.employeeRequest.update({
        where: { id: req.id },
        data: {
          status: EmployeeRequestStatus.APPROVED,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
          attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
        },
      });

      // Gửi thông báo đến nhân viên
      await this.prisma.$transaction(async (tx) => {
        const notif = await this.notifications.createForUsers(tx, [req.userId], {
          type: NotificationType.SYSTEM,
          title: 'Đã thanh toán thành công 💸',
          body: `Đơn "${req.title}" đã được thanh toán thành công qua ngân hàng.`,
          metadata: { requestId: req.id, bankRefCode: item.bankRefCode },
        });
        if (notif) this.notifications.emitCreated(notif);
      });

      successCount++;
      results.push({ requestId: req.id, status: 'SUCCESS', message: 'Thanh toán thành công' });
    }

    return {
      total: items.length,
      successCount,
      failedCount,
      skippedCount,
      results,
    };
  }
}

// Scoped employee requests regional access
