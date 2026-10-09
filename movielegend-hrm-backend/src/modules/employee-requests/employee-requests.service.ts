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
  CreateExpenseFromPurchaseDto,
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

    // --- MULTI-TIER FINANCIAL & PURCHASE WORKFLOW (ADVANCE / EXPENSE / PURCHASE) ---
    return this.prisma.$transaction(async (tx) => {
      const isPurchase = request.type === EmployeeRequestType.PURCHASE;
      const hasVat = Boolean(currentMeta.hasVat);
      const NON_VAT_ADMIN_THRESHOLD = 2000000; // 2.000.000 VNĐ

      // 1. Leader Approval stage
      if (currentStage === 'PENDING_LEADER') {
        const isLeader = request.department?.leaderUserId === actor.userId;
        if (!isLeader && !isGlobalAdmin && !isHr && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ Trưởng bộ phận hoặc Quản trị viên quản lý phòng ban mới có quyền duyệt bước này.');
        }

        let nextStage = 'PENDING_ACCOUNTANT';
        let defaultNote = '';

        if (isPurchase) {
          // Đơn mua hàng -> chuyển Kế toán duyệt thông qua
          nextStage = 'PENDING_ACCOUNTANT';
          defaultNote = 'Leader đã duyệt đề xuất mua hàng, chuyển Kế toán xem xét';
        } else if (payload?.forwardToAdmin) {
          // Duyệt chờ thanh toán -> Chuyển thẳng Ban Giám Đốc
          nextStage = 'PENDING_ADMIN';
          defaultNote = `Leader đã duyệt chờ thanh toán, chuyển Ban Giám Đốc phê duyệt`;
        } else if (payload?.disbursementProofUrl && (isAccountant || isGlobalAdmin)) {
          // Duyệt & Giải ngân ngay nếu người duyệt là Kế toán/Admin
          nextStage = 'DISBURSED';
          defaultNote = 'Đã duyệt và hoàn tất giải ngân';
        } else {
          // Luồng chuẩn: Leader duyệt xong luôn chuyển về Kế toán để Kế toán xem xét hoặc chuyển tiếp Ban Giám Đốc
          nextStage = 'PENDING_ACCOUNTANT';
          defaultNote = isPurchase
            ? 'Leader đã duyệt đề xuất mua hàng - Chuyển Kế toán'
            : hasVat
              ? 'Leader đã duyệt - Đơn có VAT chuyển Kế toán'
              : 'Leader đã duyệt - Đơn không VAT chuyển Kế toán';
        }

        const isInstantDisbursed = nextStage === 'DISBURSED';

        const newStep = {
          stage: 'PENDING_LEADER',
          action: isInstantDisbursed ? 'DISBURSED' : 'APPROVED',
          actorId: actor.userId,
          actorName,
          note: payload?.note || defaultNote,
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
            ...(isInstantDisbursed ? { status: EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() } : {}),
            attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
          },
        });

        // Notify next recipient
        if (nextStage === 'PENDING_ADMIN') {
          const adminUserIds = await this.findRelevantAdminUserIds(request.departmentId, tx);
          if (adminUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, adminUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn cần Ban Giám Đốc duyệt',
              body: `Leader đã duyệt đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Vui lòng phê duyệt.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        } else if (nextStage === 'PENDING_ACCOUNTANT') {
          const accountantUserIds = await this.findAccountantUserIds(tx);
          if (accountantUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
              type: NotificationType.SYSTEM,
              title: isPurchase ? 'Đề xuất mua hàng chuyển Kế toán' : 'Đơn thanh toán chuyển Kế toán',
              body: `Leader đã duyệt đơn "${request.title}". Chuyển Kế toán xem xét xử lý.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        }

        return updated;
      }

      // 2. Backward compatibility: PENDING_HR
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

        const isInstantDisbursed = Boolean(payload?.disbursementProofUrl);
        const nextStage = isInstantDisbursed ? 'DISBURSED' : 'PENDING_ACCOUNTANT';

        const newStep = {
          stage: 'PENDING_ADMIN',
          action: isInstantDisbursed ? 'DISBURSED' : 'APPROVED',
          actorId: actor.userId,
          actorName: actorName || 'Ban Giám Đốc',
          note: payload?.note || (isInstantDisbursed ? 'Ban Giám Đốc đã duyệt và hoàn tất giải ngân' : 'Ban Giám Đốc đã phê duyệt chi, chuyển Kế toán chi trả'),
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
            ...(isInstantDisbursed ? { status: EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() } : {}),
            attachmentMetadata: updatedMeta as Prisma.InputJsonValue,
          },
        });

        if (!isInstantDisbursed) {
          // Notify Accountants
          const accountantUserIds = await this.findAccountantUserIds(tx);
          if (accountantUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Ban Giám Đốc đã duyệt - Chuyển Kế toán chi trả',
              body: `Ban Giám Đốc đã duyệt đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Vui lòng thực hiện thanh toán/giải ngân.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        } else {
          // Thông báo cho người tạo là đã giải ngân
          const notif = await this.notifications.createForUsers(tx, [request.userId], {
            type: NotificationType.SYSTEM,
            title: 'Đã thanh toán thành công 💸',
            body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) đã được Ban Giám Đốc duyệt và giải ngân thành công.`,
            metadata: { requestId: id, disbursementProofUrl: payload?.disbursementProofUrl },
          });
          this.notifications.emitCreated(notif);
        }

        return updated;
      }

      // 4. Kế toán duyệt (PENDING_ACCOUNTANT / PENDING_DISBURSEMENT)
      if (currentStage === 'PENDING_ACCOUNTANT' || currentStage === 'PENDING_DISBURSEMENT') {
        const isAccLead = await this.isAccountantLeadActor(actor);
        if (!isAccLead && !isGlobalAdmin) {
          throw forbidden('FORBIDDEN', 'Chỉ Kế toán trưởng (Trưởng phòng Kế toán) hoặc Ban Giám Đốc mới có quyền phê duyệt bước này.');
        }

        // Nếu là đơn MUA HÀNG (PURCHASE) -> Kế toán duyệt thông qua chuyển sang PENDING_HR_PURCHASE để HR mua hàng!
        if (isPurchase) {
          const newStep = {
            stage: currentStage,
            action: 'APPROVED',
            actorId: actor.userId,
            actorName: actorName || 'Kế toán trưởng',
            note: payload?.note || 'Kế toán đã duyệt thông qua đề xuất mua hàng. Chuyển HR tiến hành mua sắm.',
            at: new Date().toISOString(),
          };

          const updatedMeta = {
            ...currentMeta,
            stage: 'PENDING_HR_PURCHASE',
            purchaseApproved: true,
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
              title: 'Đơn đề xuất mua hàng đã được duyệt 🛒',
              body: `Đề xuất mua hàng "${request.title}" của ${request.user?.profile?.fullName || 'nhân viên'} đã được duyệt. Mời HR xem đơn và tiến hành mua hàng.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }

          return updated;
        }

        // Nếu Kế toán chọn "Duyệt chờ thanh toán" -> Đẩy lên Ban Giám Đốc
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

  private async isAccountantLeadActor(actor: AuthenticatedUser): Promise<boolean> {
    if (this.scope.isRegionAdmin(actor)) return false;
    const isGlobalAdmin = (actor.roles.includes('ADMIN') && !this.scope.isRegionAdmin(actor)) || this.scope.isGlobalAdmin(actor);
    if (isGlobalAdmin || actor.roles.some((r) => ['ACCOUNTANT_LEAD', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'DIRECTOR'].includes(r.toUpperCase()))) {
      return true;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        ledDepartments: {
          select: { name: true, code: true },
        },
      },
    });
    if (!user) return false;
    return user.ledDepartments.some(
      (d) =>
        d.name.toLowerCase().includes('kế toán') ||
        d.name.toLowerCase().includes('tài chính') ||
        ['KT', 'TC', 'ACC', 'ACCOUNTING'].includes(d.code?.toUpperCase() || ''),
    );
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

    let totalAmount = 0;
    filteredRequests.forEach((req) => {
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
      const billProofUrl = meta.disbursementProofUrl || (Array.isArray(meta.images) && meta.images.length > 0 ? meta.images[0] : null);

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
        billProofUrl ? 'Xem ảnh Bill' : 'Không có bill',
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
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

      if (billProofUrl) {
        row.getCell(13).value = {
          text: 'Xem ảnh Bill 🔗',
          hyperlink: billProofUrl,
        };
        row.getCell(13).font = { name: 'Arial', size: 9.5, color: { argb: 'FF0563C1' }, underline: true };
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
    });

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
      { width: 20 }, // 13. Chứng từ / Bill đính kèm
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
