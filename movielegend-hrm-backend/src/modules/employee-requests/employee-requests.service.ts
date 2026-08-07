import { Injectable } from '@nestjs/common';
import { AccountStatus, EmployeeRequestStatus, EmployeeRequestType, Prisma, NotificationType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { BusinessTimeService } from '../time/business-time.service';
import { CreateEmployeeRequestDto, EmployeeRequestQueryDto } from './dto/employee-request.dto';

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

    // Last Admin Protection Rule (Quy tắc 1: Bảo vệ Admin cuối cùng)
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

    const request = await this.prisma.employeeRequest.create({
      data: {
        userId: actor.userId,
        departmentId,
        type: requestType,
        title: requestTitle,
        content: dto.content,
        amount: dto.amount,
        attachmentMetadata: dto.attachmentMetadata as Prisma.InputJsonValue | undefined,
        referenceId: dto.referenceId,
      },
      include: {
        user: { select: { profile: { select: { fullName: true } } } }
      }
    });

    // Notify admins, HR, and Department Leader (If ACCOUNT_DELETION, notify ADMINs only)
    const targetRoles = isAccountDeletion ? ['ADMIN'] : ['ADMIN', 'HR', 'ACCOUNTANT'];
    const admins = await this.prisma.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        roles: {
          some: {
            role: { code: { in: targetRoles } }
          }
        }
      },
      select: { id: true }
    });

    let leaderId: string | undefined;
    if (departmentId && !isAccountDeletion) {
      const dept = await this.prisma.department.findUnique({
        where: { id: departmentId },
        select: { leaderUserId: true }
      });
      if (dept?.leaderUserId) {
        leaderId = dept.leaderUserId;
      }
    }

    const targetUserIds = admins.map(a => a.id);
    if (leaderId && leaderId !== actor.userId && !targetUserIds.includes(leaderId)) {
      targetUserIds.push(leaderId);
    }

    if (targetUserIds.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        const notif = await this.notifications.createForUsers(
          tx as any,
          targetUserIds,
          {
            type: 'SYSTEM' as NotificationType,
            title: 'Yêu cầu mới',
            body: `Nhân viên ${request.user?.profile?.fullName || 'ẩn danh'} vừa gửi yêu cầu: ${request.title}`,
            metadata: { requestId: request.id }
          }
        );
        if (notif) this.notifications.emitCreated(notif);
      });
    }

    return request;
  }

  findAll(actor: AuthenticatedUser, departmentId?: string) {
    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
    const departmentFilter = this.departmentFilter(departmentId, visibleDepartmentIds);
    return this.prisma.employeeRequest.findMany({
      where: departmentFilter ? { departmentId: departmentFilter } : {},
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
                position: { select: { name: true } }
              }
            }
          }
        },
        department: { select: { name: true } }
      }
    });

    if (!request) {
      throw notFound('REQUEST_NOT_FOUND', 'Yêu cầu không tồn tại');
    }

    const isOwner = request.userId === actor.userId;
    const canApprove = actor.permissions.includes('employee.request.approve');

    if (!isOwner && !canApprove) {
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

  async approve(id: string, actor: AuthenticatedUser) {
    const request = await this.prisma.employeeRequest.findUnique({ where: { id } });
    if (!request) throw notFound('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');

    const isAccountDeletion = (request.type as string) === 'ACCOUNT_DELETION' || request.title.includes('[ACCOUNT_DELETION]');
    if (isAccountDeletion && !actor.roles.includes('ADMIN')) {
      throw forbidden('ADMIN_ONLY_APPROVAL', 'Chỉ Quản trị viên (ADMIN) mới có quyền duyệt đơn xóa tài khoản.');
    }

    if (!isAccountDeletion) {
      this.scope.assertDepartmentAccess(actor, request.departmentId);
    }
    if (request.status !== EmployeeRequestStatus.PENDING) {
      throw badRequest('EMPLOYEE_REQUEST_NOT_PENDING', 'Yêu cầu không còn chờ duyệt');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeRequest.update({
        where: { id },
        data: { status: EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
      });

      // Handle ACCOUNT_DELETION approval (supports both enum type and fallback title tag)
      if ((request.type as string) === 'ACCOUNT_DELETION' || request.title.includes('[ACCOUNT_DELETION]')) {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 30);

        // Check if there is a successor mentioned in title
        const successorMatch = request.title.match(/\[Kế nhiệm: ([^\]]+)\]/);
        if (successorMatch) {
          const successorName = successorMatch[1].trim();
          // Find successor user accurately by ID, userCode, or fullName
          const successorUser = await tx.user.findFirst({
            where: {
              OR: [
                { id: successorName },
                { userCode: successorName },
                { profile: { fullName: { contains: successorName } } }
              ]
            },
            select: { id: true }
          });

          if (successorUser) {
            const adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } });
            if (adminRole) {
              const existingAdminRole = await tx.userRole.findFirst({
                where: { userId: successorUser.id, roleId: adminRole.id }
              });
              if (!existingAdminRole) {
                await tx.userRole.create({
                  data: { userId: successorUser.id, roleId: adminRole.id }
                });
              }
            }
          }
        }

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

  async reject(id: string, actor: AuthenticatedUser) {
    const request = await this.prisma.employeeRequest.findUnique({ where: { id } });
    if (!request) throw notFound('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');
    this.scope.assertDepartmentAccess(actor, request.departmentId);
    if (request.status !== EmployeeRequestStatus.PENDING) {
      throw badRequest('EMPLOYEE_REQUEST_NOT_PENDING', 'Yêu cầu không còn chờ duyệt');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeRequest.update({
        where: { id },
        data: { status: EmployeeRequestStatus.REJECTED, decidedByUserId: actor.userId, decidedAt: new Date() },
      });

      const notif = await this.notifications.createForUsers(tx, [request.userId], {
        type: NotificationType.SYSTEM,
        title: 'Yêu cầu bị từ chối',
        body: `Yêu cầu "${request.title}" của bạn đã bị từ chối.`,
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
}
