import { Injectable } from '@nestjs/common';
import { EmployeeRequestStatus, EmployeeRequestType, Prisma, NotificationType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, notFound } from '../../common/utils/error.util';
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
    const request = await this.prisma.employeeRequest.create({
      data: {
        userId: actor.userId,
        departmentId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        amount: dto.amount,
        attachmentMetadata: dto.attachmentMetadata as Prisma.InputJsonValue | undefined,
        referenceId: dto.referenceId,
      },
      include: {
        user: { select: { profile: { select: { fullName: true } } } }
      }
    });

    // Notify admins and HR
    const admins = await this.prisma.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        roles: {
          some: {
            role: { code: { in: ['ADMIN', 'HR', 'ACCOUNTANT'] } }
          }
        }
      },
      select: { id: true }
    });

    if (admins.length > 0) {
      this.prisma.$transaction(async (tx) => {
        const notif = await this.notifications.createForUsers(
          tx as any,
          admins.map(a => a.id),
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
    this.scope.assertDepartmentAccess(actor, request.departmentId);
    if (request.status !== EmployeeRequestStatus.PENDING) {
      throw badRequest('EMPLOYEE_REQUEST_NOT_PENDING', 'Yêu cầu không còn chờ duyệt');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeRequest.update({
        where: { id },
        data: { status: EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
      });

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
