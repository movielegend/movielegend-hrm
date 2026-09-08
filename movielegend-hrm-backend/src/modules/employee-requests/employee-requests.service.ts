import { Injectable } from '@nestjs/common';
import { AccountStatus, EmployeeRequestStatus, EmployeeRequestType, Prisma, NotificationType, RoleScopeType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { BusinessTimeService } from '../time/business-time.service';
import { CreateEmployeeRequestDto, EmployeeRequestQueryDto, ApproveEmployeeRequestDto, RejectEmployeeRequestDto } from './dto/employee-request.dto';
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
    const requestTitle = isAccountDeletion && !dto.title.includes('[ACCOUNT_DELETION]') 
      ? `[ACCOUNT_DELETION] ${dto.title}` 
      : dto.title;

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
    const initialStage = isFinancial
      ? (isCreatorLeader ? 'PENDING_HR' : 'PENDING_LEADER')
      : 'PENDING';

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
      // 1. Leader Approval stage -> Move to PENDING_HR
      if (currentStage === 'PENDING_LEADER') {
        const isLeader = request.department?.leaderUserId === actor.userId;
        if (!isLeader && !isGlobalAdmin && !isHr && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ Trưởng bộ phận hoặc Quản trị viên quản lý phòng ban mới có quyền duyệt bước này.');
        }

        const newStep = {
          stage: 'PENDING_LEADER',
          action: 'APPROVED',
          actorId: actor.userId,
          actorName,
          note: payload?.note || 'Đã duyệt sơ bộ',
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: 'PENDING_HR',
          approvalSteps: [...existingSteps, newStep],
        };

        const updated = await tx.employeeRequest.update({
          where: { id },
          data: { attachmentMetadata: updatedMeta as Prisma.InputJsonValue },
        });

        // Notify HR users
        const hrUserIds = await this.findHrUserIds(tx);
        if (hrUserIds.length > 0) {
          const notif = await this.notifications.createForUsers(tx, hrUserIds, {
            type: NotificationType.SYSTEM,
            title: 'Đơn cần đối chứng (HR)',
            body: `Leader đã duyệt đơn "${request.title}". Vui lòng đối chứng hồ sơ.`,
            metadata: { requestId: id },
          });
          this.notifications.emitCreated(notif);
        }

        return updated;
      }

      // 2. HR Verification & Decision stage -> Branch based on 5.000.000 VNĐ
      if (currentStage === 'PENDING_HR') {
        if (!isHr && !actor.roles.includes('ADMIN')) {
          throw forbidden('FORBIDDEN', 'Chỉ Leader HR hoặc Quản trị viên mới có quyền đối chứng và duyệt bước này.');
        }

        const isUnderOrEqual5M = amount <= 5000000;
        const nextStage = isUnderOrEqual5M ? 'PENDING_DISBURSEMENT' : 'PENDING_ADMIN';
        const action = isUnderOrEqual5M ? 'APPROVED' : 'VERIFIED';

        const newStep = {
          stage: 'PENDING_HR',
          action,
          actorId: actor.userId,
          actorName,
          note: payload?.note || (isUnderOrEqual5M ? 'HR đã duyệt hợp lệ' : 'HR đã đối chứng công & lương hợp lệ, chuyển Admin phê duyệt'),
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
        if (isUnderOrEqual5M) {
          // Notify Accountants
          const accountantUserIds = await this.findAccountantUserIds(tx);
          if (accountantUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn chờ giải ngân',
              body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) đã được duyệt, chuyển sang Kế toán để giải ngân.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        } else {
          // Notify Admins
          const adminUserIds = await this.findRelevantAdminUserIds(request.departmentId, tx);
          if (adminUserIds.length > 0) {
            const notif = await this.notifications.createForUsers(tx, adminUserIds, {
              type: NotificationType.SYSTEM,
              title: 'Đơn trên 5 triệu cần duyệt (Admin)',
              body: `HR đã đối chứng đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Vui lòng phê duyệt.`,
              metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
          }
        }

        return updated;
      }

      // 3. Admin Approval stage (> 5M) -> Move to PENDING_DISBURSEMENT
      if (currentStage === 'PENDING_ADMIN') {
        if (!isGlobalAdmin && !canDeptAccess) {
          throw forbidden('FORBIDDEN', 'Chỉ Quản trị viên quản lý đơn từ thuộc miền của mình hoặc Ban Giám Đốc mới có quyền phê duyệt.');
        }

        const newStep = {
          stage: 'PENDING_ADMIN',
          action: 'APPROVED',
          actorId: actor.userId,
          actorName,
          note: payload?.note || 'Ban Giám Đốc đã phê duyệt chi',
          at: new Date().toISOString(),
        };

        const updatedMeta = {
          ...currentMeta,
          stage: 'PENDING_DISBURSEMENT',
          approvalSteps: [...existingSteps, newStep],
        };

        const updated = await tx.employeeRequest.update({
          where: { id },
          data: { attachmentMetadata: updatedMeta as Prisma.InputJsonValue },
        });

        // Notify Accountants
        const accountantUserIds = await this.findAccountantUserIds(tx);
        if (accountantUserIds.length > 0) {
          const notif = await this.notifications.createForUsers(tx, accountantUserIds, {
            type: NotificationType.SYSTEM,
            title: 'Đơn đã duyệt - Chờ giải ngân',
            body: `Admin đã duyệt đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ). Vui lòng thực hiện giải ngân.`,
            metadata: { requestId: id },
          });
          this.notifications.emitCreated(notif);
        }

        return updated;
      }

      // 4. Accountant Disbursement stage -> Final DISBURSED
      if (currentStage === 'PENDING_DISBURSEMENT') {
        if (!isAccountant && !actor.roles.includes('ADMIN')) {
          throw forbidden('FORBIDDEN', 'Chỉ Kế toán hoặc Quản trị viên mới có quyền xác nhận giải ngân.');
        }

        const newStep = {
          stage: 'PENDING_DISBURSEMENT',
          action: 'DISBURSED',
          actorId: actor.userId,
          actorName,
          note: payload?.note || 'Đã chuyển tiền / giải ngân thành công',
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
          title: 'Đã giải ngân thành công 💸',
          body: `Đơn "${request.title}" (${amount.toLocaleString('vi-VN')} VNĐ) của bạn đã được Kế toán giải ngân thành công.`,
          metadata: { requestId: id, disbursementProofUrl: payload?.disbursementProofUrl },
        });
        this.notifications.emitCreated(notif);

        return updated;
      }

      throw badRequest('INVALID_STAGE', `Giai đoạn ${currentStage} không hợp lệ để duyệt`);
    });
  }

  async reject(id: string, actor: AuthenticatedUser, payload?: RejectEmployeeRequestDto) {
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
          throw forbidden('FORBIDDEN', 'Chỉ Quản trị viên quản lý đơn từ thuộc miền của mình mới có quyền từ chối bước này.');
        }
      } else if (currentStage === 'PENDING_DISBURSEMENT') {
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
    const actorName = actorProfile?.fullName || (actor.roles.includes('ADMIN') ? 'Ban Giám Đốc' : isHr ? 'Trưởng phòng HR' : isAccountant ? 'Kế toán' : 'Người duyệt');

    const newStep = {
      stage: currentStage,
      action: 'REJECTED',
      actorId: actor.userId,
      actorName,
      reason: payload?.reason || 'Không đáp ứng điều kiện',
      at: new Date().toISOString(),
    };

    const updatedMeta = {
      ...currentMeta,
      stage: 'REJECTED',
      rejectReason: payload?.reason || 'Không đáp ứng điều kiện',
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
        title: 'Yêu cầu bị từ chối',
        body: `Yêu cầu "${request.title}" của bạn đã bị từ chối. Lý do: ${payload?.reason || 'Không đáp ứng điều kiện'}`,
        metadata: { requestId: id },
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
}

// Scoped employee requests regional access
