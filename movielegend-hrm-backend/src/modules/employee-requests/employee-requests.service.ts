import { Injectable } from '@nestjs/common';
import { AccountStatus, EmployeeRequestStatus, EmployeeRequestType, Prisma, NotificationType, RoleScopeType } from '@prisma/client';
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

    const requestType = isAccountDeletion ? EmployeeRequestType.OTHER : dto.type;
    let requestTitle = dto.title;
    if (isAccountDeletion && !dto.title.includes('[ACCOUNT_DELETION]')) {
      requestTitle = `[ACCOUNT_DELETION] ${dto.title}`;
    } else if (dto.type === EmployeeRequestType.BUSINESS_TRIP && (!dto.title || dto.title.trim() === '' || dto.title === 'Công tác' || dto.title === 'Yêu cầu')) {
      const meta: any = dto.attachmentMetadata || {};
      const loc = meta.location || 'Ngoài công ty';
      const fromD = meta.fromDate ? String(meta.fromDate).split('T')[0] : '';
      const toD = meta.toDate ? String(meta.toDate).split('T')[0] : fromD;
      requestTitle = `Công tác: ${loc}${fromD ? ` (${fromD}${toD && toD !== fromD ? ` -> ${toD}` : ''})` : ''}`;
    }

    const isFinancial = dto.type === EmployeeRequestType.ADVANCE || dto.type === EmployeeRequestType.EXPENSE || dto.type === EmployeeRequestType.PURCHASE;

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

    let initialStage = 'PENDING';
    if (isFinancial) {
      if (isCreatorLeader) {
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

  async findAll(actor: AuthenticatedUser, departmentId?: string) {
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
    } else if (isGlobalAdmin || isHr) {
      if (departmentId) {
        where = { departmentId };
      }
    } else if (isAccountant) {
      // Accountant: can see ALL financial requests across all departments,
      // PLUS any requests within their own department(s)
      const visibleDepartmentIds = (await this.scope.getVisibleDepartmentIds(actor)) || [];
      const financialTypes: EmployeeRequestType[] = [
        EmployeeRequestType.ADVANCE,
        EmployeeRequestType.EXPENSE,
        EmployeeRequestType.PURCHASE,
      ];

      if (departmentId) {
        if (visibleDepartmentIds.includes(departmentId)) {
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
        if (visibleDepartmentIds.length > 0) {
          orConditions.push({ departmentId: { in: visibleDepartmentIds } });
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

    return this.prisma.employeeRequest.findMany({
      where,
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

    const actorProfile = await this.prisma.employeeProfile.findUnique({ where: { userId: actor.userId } });
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
          const fromDateStr = meta.fromDate ? String(meta.fromDate).split('T')[0] : null;
          const toDateStr = meta.toDate ? String(meta.toDate).split('T')[0] : fromDateStr;
          const location = meta.location || '';
          const startTime = meta.startTime || '08:00';
          const endTime = meta.endTime || '17:30';

          if (fromDateStr) {
            const start = moment.tz(fromDateStr, 'YYYY-MM-DD', 'Asia/Ho_Chi_Minh');
            const end = moment.tz(toDateStr || fromDateStr, 'YYYY-MM-DD', 'Asia/Ho_Chi_Minh');
            const curr = moment(start);

            while (curr.isSameOrBefore(end, 'day')) {
              const workDateStr = curr.format('YYYY-MM-DD');
              const workDate = new Date(`${workDateStr}T00:00:00.000Z`);

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
        }

        const notif = await this.notifications.createForUsers(tx, [request.userId], {
          type: NotificationType.SYSTEM,
          title: 'Yêu cầu đã được duyệt',
          body: `Yêu cầu "${request.title}" của bạn đã được duyệt.`,
          metadata: { requestId: id },
        });
        this.notifications.emitCreated(notif);

        return updated;
      });
    }

    // --- MULTI-TIER FINANCIAL WORKFLOW (ADVANCE / EXPENSE / PURCHASE) ---
    return this.prisma.$transaction(async (tx) => {
      const hasVat = Boolean(currentMeta.hasVat);
      const NON_VAT_ADMIN_THRESHOLD = 2000000; // 2.000.000 VNĐ theo sơ đồ (Trên 2tr: A Kiên)

      // 1. Leader Approval stage -> Fork based on VAT & Threshold
      if (currentStage === 'PENDING_LEADER') {
        const isLeader = request.department?.leaderUserId === actor.userId;
        if (!isLeader && !isGlobalAdmin && !isHr && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ Trưởng bộ phận hoặc Quản trị viên quản lý phòng ban mới có quyền duyệt bước này.');
        }

        let nextStage = 'PENDING_ACCOUNTANT';
        let defaultNote = '';

        if (hasVat) {
          // Có hóa đơn VAT -> Chị Tâm (Kế toán)
          nextStage = 'PENDING_ACCOUNTANT';
          defaultNote = 'Leader đã duyệt - Đơn có hóa đơn VAT chuyển Chị Tâm (Kế toán)';
        } else {
          // K° VAT -> Kiểm tra hạn mức
          if (amount > NON_VAT_ADMIN_THRESHOLD) {
            // Trên hạn mức -> A Kiên (Ban Giám Đốc)
            nextStage = 'PENDING_ADMIN';
            defaultNote = `Leader đã duyệt - Đơn không VAT vượt hạn mức (> ${NON_VAT_ADMIN_THRESHOLD.toLocaleString('vi-VN')} VNĐ) chuyển A Kiên (Ban Giám Đốc) phê duyệt`;
          } else {
            // Dưới hạn mức -> Chị Tâm (Kế toán)
            nextStage = 'PENDING_ACCOUNTANT';
            defaultNote = 'Leader đã duyệt - Đơn không VAT dưới hạn mức chuyển Chị Tâm (Kế toán)';
          }
        }

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
          data: { attachmentMetadata: updatedMeta as Prisma.InputJsonValue },
        });

        // Notify next recipient
        if (nextStage === 'PENDING_ADMIN') {
          const adminUserIds = await this.findRelevantAdminUserIds(request.departmentId, tx);
          if (adminUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, adminUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn thanh toán cần A Kiên (Ban Giám Đốc) duyệt',
              body: `Leader đã duyệt đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ - Không VAT). Vui lòng phê duyệt.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        } else {
          // Chuyển Chị Tâm (Kế toán)
          const accountantUserIds = await this.findAccountantUserIds(tx);
          if (accountantUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn thanh toán chuyển Chị Tâm (Kế toán)',
              body: `Leader đã duyệt đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Chuyển Kế toán xử lý.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        }

        return updated;
      }

      // 2. Backward compatibility: PENDING_HR (nếu còn đơn cũ ở stage này)
      if (currentStage === 'PENDING_HR') {
        if (!isHr && !actor.roles.includes('ADMIN')) {
          throw forbidden('FORBIDDEN', 'Chỉ Leader HR hoặc Quản trị viên mới có quyền đối chứng và duyệt bước này.');
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
              title: 'Đơn không VAT cần A Kiên duyệt',
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
              body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) đã được xác nhận, chuyển Chị Tâm (Kế toán).`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        }

        return updated;
      }

      // 3. A Kiên Approval stage (PENDING_ADMIN: K° VAT trên hạn mức) -> Move to PENDING_ACCOUNTANT (Chị Tâm)
      if (currentStage === 'PENDING_ADMIN') {
        if (!isGlobalAdmin && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ A Kiên (Ban Giám Đốc) hoặc Quản trị viên quản lý đơn từ thuộc miền của mình mới có quyền phê duyệt.');
        }

        const newStep = {
          stage: 'PENDING_ADMIN',
          action: 'APPROVED',
          actorId: actor.userId,
          actorName: actorName || 'A Kiên (Ban Giám Đốc)',
          note: payload?.note || 'A Kiên (Ban Giám Đốc) đã phê duyệt chi',
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: 'PENDING_ACCOUNTANT',
          approvalSteps: [...existingSteps, newStep],
        };

        const updated = await tx.employeeRequest.update({
          where: { id },
          data: { attachmentMetadata: updatedMeta as Prisma.InputJsonValue },
        });

        // Notify Accountants (Chị Tâm)
        const accountantUserIds = await this.findAccountantUserIds(tx);
        if (accountantUserIds.length > 0) {
          const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
            type: NotificationType.SYSTEM,
            title: 'A Kiên đã duyệt - Chuyển Chị Tâm chi trả',
            body: `Ban Giám Đốc đã duyệt đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Vui lòng thực hiện thanh toán/giải ngân.`,
            metadata: { requestId: id },
          });
          this.notifications.emitCreated(notif);
        }

        return updated;
      }

      // 4. Chị Tâm (Kế toán) Disbursement stage -> Final DISBURSED / APPROVED
      if (currentStage === 'PENDING_ACCOUNTANT' || currentStage === 'PENDING_DISBURSEMENT') {
        if (!isAccountant && !actor.roles.includes('ADMIN')) {
          throw forbidden('FORBIDDEN', 'Chỉ Chị Tâm (Kế toán) hoặc Quản trị viên mới có quyền xác nhận thanh toán/giải ngân.');
        }

        const newStep = {
          stage: currentStage,
          action: 'DISBURSED',
          actorId: actor.userId,
          actorName: actorName || 'Chị Tâm (Kế toán)',
          note: payload?.note || 'Chị Tâm (Kế toán) đã thanh toán / giải ngân thành công',
          disbursementProofUrl: payload?.disbursementProofUrl,
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: 'DISBURSED',
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
          body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) của bạn đã được Kế toán thanh toán thành công.`,
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
        if (!isLeader && !isGlobalAdmin && !isHr) {
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
        if (!isAccountant && !isGlobalAdmin) {
          throw forbidden('FORBIDDEN', 'Chỉ Kế toán hoặc Quản trị viên mới có quyền từ chối bước này.');
        }
      }
    }

    const currentMeta = (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null)
      ? { ...(request.attachmentMetadata as Record<string, any>) }
      : {};
    const currentStage = currentMeta.stage || 'PENDING';
    const existingSteps = Array.isArray(currentMeta.approvalSteps) ? currentMeta.approvalSteps : [];

    const actorProfile = await this.prisma.employeeProfile.findUnique({ where: { userId: actor.userId } });
    const actorName = actorProfile?.fullName || (actor.roles.includes('ADMIN') ? 'Ban Giám Đốc (A Kiên)' : isHr ? 'Trưởng phòng HR' : isAccountant ? 'Chị Tâm (Kế toán)' : 'Trưởng bộ phận');

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
        title: 'Yêu cầu thanh toán bị từ chối ❌',
        body: `Đơn "${request.title}" của bạn đã bị từ chối bởi ${actorName}. Lý do: ${payload.reason.trim()}`,
        metadata: { requestId: id, reason: payload.reason.trim() },
      });
      this.notifications.emitCreated(notif);

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
      EmployeeRequestType.PURCHASE,
    ]);
    if (financialTypes.has(dto.type) && (dto.amount === undefined || dto.amount <= 0)) {
      throw badRequest('EMPLOYEE_REQUEST_AMOUNT_REQUIRED', 'Yêu cầu tài chính phải có số tiền hợp lệ');
    }
  }

  private async isAccountantActor(actor: AuthenticatedUser): Promise<boolean> {
    if (this.scope.isRegionAdmin(actor)) return false;
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !this.scope.isRegionAdmin(actor)) || this.scope.isGlobalAdmin(actor);
    if (isGlobalAdmin || actor.roles.some((r) => ['ACCOUNTANT', 'ACCOUNTING', 'ACC', 'DIRECTOR'].includes(r))) {
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
    const isAccountant = await this.isAccountantActor(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !this.scope.isRegionAdmin(actor)) || this.scope.isGlobalAdmin(actor);

    // Xử lý khoảng thời gian (theo ngày hoặc từ ngày - đến ngày)
    let startOfDay: Date;
    let endOfDay: Date;
    if (query.date) {
      startOfDay = new Date(`${query.date}T00:00:00.000+07:00`);
      endOfDay = new Date(`${query.date}T23:59:59.999+07:00`);
    } else if (query.fromDate && query.toDate) {
      startOfDay = new Date(`${query.fromDate}T00:00:00.000+07:00`);
      endOfDay = new Date(`${query.toDate}T23:59:59.999+07:00`);
    } else {
      const today = new Date();
      const tzOffset = 7 * 60; // ICT +7
      const localDate = new Date(today.getTime() + (today.getTimezoneOffset() + tzOffset) * 60000);
      const dateStr = localDate.toISOString().split('T')[0];
      startOfDay = new Date(`${dateStr}T00:00:00.000+07:00`);
      endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);
    }

    const financialTypes = [EmployeeRequestType.EXPENSE, EmployeeRequestType.ADVANCE, EmployeeRequestType.PURCHASE];
    let typeFilter: any = { in: financialTypes };
    if (query.type && query.type !== 'ALL') {
      typeFilter = query.type as EmployeeRequestType;
    }

    const where: Prisma.EmployeeRequestWhereInput = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      type: typeFilter,
      ...(query.status && query.status !== 'ALL' ? { status: query.status as EmployeeRequestStatus } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    };

    if (!isAccountant && !isGlobalAdmin) {
      const visibleDepartmentIds = await this.scope.getVisibleDepartmentIds(actor);
      if (visibleDepartmentIds) {
        where.departmentId = { in: visibleDepartmentIds };
      }
    }

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

    const worksheet = workbook.addWorksheet('Giao Dịch Thanh Toán', {
      views: [{ showGridLines: true }],
    });

    // Header công ty
    worksheet.mergeCells('A1:Q1');
    const titleCell1 = worksheet.getCell('A1');
    titleCell1.value = 'CÔNG TY TNHH THƯƠNG MẠI VÀ CÔNG NGHỆ MOVIE LEGEND';
    titleCell1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E293B' } };
    titleCell1.alignment = { vertical: 'middle', horizontal: 'left' };

    worksheet.mergeCells('A2:Q2');
    const titleCell2 = worksheet.getCell('A2');
    const dateLabel = query.date || (query.fromDate && query.toDate ? `${query.fromDate} đến ${query.toDate}` : new Date().toISOString().split('T')[0]);
    titleCell2.value = `BẢNG KÊ GIAO DỊCH THANH TOÁN (NGÀY: ${dateLabel})`;
    titleCell2.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF0F172A' } };
    titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A3:Q3');
    const titleCell3 = worksheet.getCell('A3');
    titleCell3.value = `Thời gian xuất: ${new Date().toLocaleString('vi-VN')} | Người xuất: ${actor.userId}`;
    titleCell3.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    titleCell3.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // Dòng trống

    // Dòng tiêu đề cột (Row 5)
    const headerRow = worksheet.addRow([
      'STT',
      'Mã Đơn',
      'Thời Gian',
      'Nhân Viên',
      'Mã NV',
      'Phòng Ban',
      'Loại Chi Phí',
      'Nội Dung / Tiêu Đề',
      'Số Tiền (VNĐ)',
      'Hóa Đơn VAT',
      'Chủ Tài Khoản',
      'Số Tài Khoản',
      'Ngân Hàng',
      'Cấp Duyệt',
      'Trạng Thái',
      'Lý Do Từ Chối (nếu có)',
      'Mã Tham Chiếu GD',
    ]);

    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 28;

    headerRow.eachCell((cell: any) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    let totalAmount = 0;
    filteredRequests.forEach((req, idx) => {
      const meta = (typeof req.attachmentMetadata === 'object' && req.attachmentMetadata !== null)
        ? (req.attachmentMetadata as Record<string, any>)
        : {};
      const amountNum = Number(req.amount || 0);
      totalAmount += amountNum;

      const hasVat = Boolean(meta.hasVat);
      const stage = meta.stage || req.status;
      const stageLabel =
        stage === 'PENDING_LEADER' ? 'Chờ Leader duyệt' :
        stage === 'PENDING_ADMIN' ? 'Chờ A Kiên (Giám đốc) duyệt' :
        stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_DISBURSEMENT' ? 'Chờ Chị Tâm (Kế toán) chi' :
        stage === 'DISBURSED' || req.status === 'APPROVED' ? 'Đã chi tiền' :
        req.status === 'REJECTED' ? 'Bị từ chối' : stage;

      const statusLabel =
        req.status === 'APPROVED' ? 'Đã duyệt / Đã thanh toán' :
        req.status === 'REJECTED' ? 'Từ chối' : 'Chờ xử lý';

      const reqAny = req as any;
      const primaryBank = reqAny.user?.profile?.bankAccounts?.find((b: any) => b.isPrimary) || reqAny.user?.profile?.bankAccounts?.[0];
      const beneficiaryName = meta.beneficiaryName || primaryBank?.accountName || reqAny.user?.profile?.fullName || '';
      const beneficiaryAccount = meta.beneficiaryAccount || primaryBank?.accountNumber || '';
      const beneficiaryBank = meta.beneficiaryBank || primaryBank?.bankName || '';

      const row = worksheet.addRow([
        idx + 1,
        req.id.slice(0, 8).toUpperCase(),
        new Date(req.createdAt).toLocaleString('vi-VN'),
        reqAny.user?.profile?.fullName || 'Nhân viên',
        reqAny.user?.userCode || '',
        reqAny.department?.name || '',
        req.type === 'EXPENSE' ? 'Thanh toán' : req.type === 'ADVANCE' ? 'Tạm ứng' : req.type,
        req.title + (req.content ? ` - ${req.content}` : ''),
        amountNum,
        hasVat ? 'Có VAT' : 'Không VAT',
        beneficiaryName,
        beneficiaryAccount,
        beneficiaryBank,
        stageLabel,
        statusLabel,
        meta.rejectReason || '',
        meta.bankRefCode || '',
      ]);

      row.font = { name: 'Arial', size: 10 };
      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(9).numFmt = '#,##0" đ"';
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(14).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(15).alignment = { vertical: 'middle', horizontal: 'center' };

      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // Dòng tổng cộng
    const totalRow = worksheet.addRow([
      'Tổng cộng',
      '',
      '',
      '',
      '',
      '',
      '',
      `${filteredRequests.length} giao dịch`,
      totalAmount,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    worksheet.mergeCells(`A${totalRow.number}:G${totalRow.number}`);
    totalRow.font = { name: 'Arial', size: 11, bold: true };
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(9).numFmt = '#,##0" đ"';
    totalRow.eachCell((cell: any) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF94A3B8' } },
      };
    });

    // Căn chỉnh độ rộng cột
    worksheet.columns.forEach((col: any) => {
      let maxLen = 12;
      col.eachCell({ includeEmpty: false }, (cell: any) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = Math.min(len, 40);
      });
      col.width = maxLen + 3;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      filename: `Giao-dich-thanh-toan-${dateLabel}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(buffer),
    };
  }

  async importPaymentFile(
    fileBuffer: Buffer | null,
    batchData: ImportPaymentBatchDto | null,
    actor: AuthenticatedUser,
  ) {
    const isAccountant = await this.isAccountantActor(actor);
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !this.scope.isRegionAdmin(actor)) || this.scope.isGlobalAdmin(actor);
    if (!isAccountant && !isGlobalAdmin) {
      throw forbidden('FORBIDDEN', 'Chỉ Chị Tâm (Kế toán) hoặc Quản trị viên mới có quyền đẩy file thanh toán.');
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
        actorName: 'Chị Tâm (Kế toán)',
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
