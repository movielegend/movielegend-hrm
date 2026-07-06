import { Injectable } from '@nestjs/common';
import {
  EmployeeRequestStatus,
  EmployeeRequestType,
  LeaveRequestStatus,
  NotificationType,
  OvertimeRequestStatus,
  Prisma,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { BusinessTimeService } from '../time/business-time.service';
import {
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  CreateOvertimeRequestDto,
  LeaveRequestQueryDto,
  OvertimeRequestQueryDto,
  RejectRequestDto,
} from './dto/leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService = {
      createForUsers: async () => null,
      emitCreated: () => undefined,
    } as unknown as NotificationsService,
    private readonly businessTime: BusinessTimeService = new BusinessTimeService(),
  ) {}

  createLeaveType(dto: CreateLeaveTypeDto) {
    return this.prisma.leaveType.create({ data: dto });
  }

  findActiveLeaveTypes() {
    return this.prisma.leaveType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        isPaid: true,
        isActive: true,
        annualQuotaDays: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createLeaveRequest(dto: CreateLeaveRequestDto, actor: AuthenticatedUser) {
    const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
    const startDate = this.businessTime.startOfBusinessDate(dto.startDate);
    const endDate = this.businessTime.startOfBusinessDate(dto.endDate);
    if (endDate < startDate) throw badRequest('INVALID_LEAVE_DATE_RANGE', 'Ngay ket thuc phai sau ngay bat dau');
    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: dto.leaveTypeId, isActive: true },
    });
    if (!leaveType) throw notFound('LEAVE_TYPE_NOT_FOUND', 'Khong tim thay loai nghi phep');
    const totalDays = this.businessTime.inclusiveDays(startDate, endDate);
    await this.assertLeaveBalance(actor.userId, dto.leaveTypeId, startDate.getUTCFullYear(), totalDays);
    await this.assertNoLeaveOverlap(actor.userId, startDate, endDate);
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          userId: actor.userId,
          departmentId,
          leaveTypeId: dto.leaveTypeId,
          startDate,
          endDate,
          totalDays,
          reason: dto.reason,
        },
      });
      await tx.employeeRequest.create({
        data: {
          userId: actor.userId,
          departmentId,
          type: EmployeeRequestType.LEAVE,
          title: 'Don nghi phep',
          content: dto.reason,
          referenceId: request.id,
        },
      });
      return request;
    });
  }

  findLeaveRequests(actor: AuthenticatedUser, query: LeaveRequestQueryDto) {
    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
    const departmentFilter = this.departmentFilter(query.departmentId, visibleDepartmentIds);
    return this.prisma.leaveRequest.findMany({
      where: {
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
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
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  approveLeave(id: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({ where: { id } });
      if (!request) throw notFound('LEAVE_REQUEST_NOT_FOUND', 'Khong tim thay don nghi');
      this.scope.assertDepartmentAccess(actor, request.departmentId);
      if (request.status !== LeaveRequestStatus.PENDING) {
        throw badRequest('LEAVE_ALREADY_PROCESSED', 'Don nghi da duoc xu ly');
      }
      const balance = await tx.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: request.userId,
            leaveTypeId: request.leaveTypeId,
            year: request.startDate.getUTCFullYear(),
          },
        },
      });
      if (!balance || Number(balance.balanceDays) - Number(balance.usedDays) < Number(request.totalDays)) {
        throw badRequest('LEAVE_BALANCE_INSUFFICIENT', 'Khong du ngay phep');
      }
      const approved = await tx.leaveRequest.update({
        where: { id },
        data: { status: LeaveRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
      });
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: { increment: request.totalDays } },
      });
      await tx.employeeRequest.updateMany({
        where: { referenceId: id, type: EmployeeRequestType.LEAVE },
        data: { status: EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
      });
      return approved;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async rejectLeave(id: string, dto: RejectRequestDto, actor: AuthenticatedUser) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw notFound('LEAVE_REQUEST_NOT_FOUND', 'Khong tim thay don nghi');
    this.scope.assertDepartmentAccess(actor, request.departmentId);
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw badRequest('LEAVE_ALREADY_PROCESSED', 'Don nghi da duoc xu ly');
    }
    return this.prisma.$transaction(async (tx) => {
      const rejected = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.REJECTED,
          rejectionReason: dto.reason,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
      });
      await tx.employeeRequest.updateMany({
        where: { referenceId: id, type: EmployeeRequestType.LEAVE },
        data: { status: EmployeeRequestStatus.REJECTED, decidedByUserId: actor.userId, decidedAt: new Date() },
      });
      return rejected;
    });
  }

  async createOvertimeRequest(dto: CreateOvertimeRequestDto, actor: AuthenticatedUser) {
    const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw badRequest('INVALID_OVERTIME_TIME_RANGE', 'Gio ket thuc tang ca phai sau gio bat dau');
    await this.assertNoOvertimeOverlap(actor.userId, startAt, endAt);
    return this.prisma.overtimeRequest.create({
      data: {
        userId: actor.userId,
        departmentId,
        workDate: this.businessTime.startOfBusinessDate(dto.workDate),
        startAt,
        endAt,
        reason: dto.reason,
      },
    });
  }

  async approveOvertime(id: string, actor: AuthenticatedUser) {
    const request = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!request) throw notFound('OVERTIME_REQUEST_NOT_FOUND', 'Khong tim thay don tang ca');
    this.scope.assertDepartmentAccess(actor, request.departmentId);
    if (request.status !== OvertimeRequestStatus.PENDING) {
      throw badRequest('OVERTIME_REQUEST_INVALID_STATE', 'Don tang ca khong con cho duyet');
    }
    return this.prisma.overtimeRequest.update({
      where: { id },
      data: { status: OvertimeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
    });
  }

  async rejectOvertime(id: string, dto: RejectRequestDto, actor: AuthenticatedUser) {
    const request = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!request) throw notFound('OVERTIME_REQUEST_NOT_FOUND', 'Khong tim thay don tang ca');
    this.scope.assertDepartmentAccess(actor, request.departmentId);
    if (request.status !== OvertimeRequestStatus.PENDING) {
      throw badRequest('OVERTIME_REQUEST_INVALID_STATE', 'Don tang ca khong con cho duyet');
    }
    const payload = await this.prisma.$transaction(async (tx) => {
      const rejected = await tx.overtimeRequest.update({
        where: { id },
        data: {
          status: OvertimeRequestStatus.REJECTED,
          rejectionReason: dto.reason,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'overtime.reject',
          entityType: 'OvertimeRequest',
          entityId: id,
          metadata: { reason: dto.reason, userId: request.userId },
        },
      });
      const notification = await this.notifications.createForUsers(tx, [request.userId], {
        type: NotificationType.SYSTEM,
        title: 'Overtime request rejected',
        body: dto.reason,
        metadata: { overtimeRequestId: id },
      });
      return { rejected, notification };
    });
    this.notifications.emitCreated(payload.notification);
    return payload.rejected;
  }

  findMyOvertimeRequests(actor: AuthenticatedUser, query: OvertimeRequestQueryDto) {
    const where: Prisma.OvertimeRequestWhereInput = {
      userId: actor.userId,
      ...(query.status ? { status: query.status } : {}),
      ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
        ? { workDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
        : {}),
    };
    return this.paginatedOvertime(where, query);
  }

  findPendingOvertimeRequests(actor: AuthenticatedUser, query: OvertimeRequestQueryDto) {
    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
    const departmentFilter = this.departmentFilter(undefined, visibleDepartmentIds);
    const where: Prisma.OvertimeRequestWhereInput = {
      status: query.status ?? OvertimeRequestStatus.PENDING,
      ...(departmentFilter ? { departmentId: departmentFilter } : {}),
      ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
        ? { workDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
        : {}),
    };
    return this.paginatedOvertime(where, query);
  }

  private async paginatedOvertime(where: Prisma.OvertimeRequestWhereInput, query: OvertimeRequestQueryDto) {
    const [items, total] = await Promise.all([
      this.prisma.overtimeRequest.findMany({
        where,
        include: {
          user: { select: { id: true, userCode: true, phone: true, email: true, profile: true } },
          department: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.overtimeRequest.count({ where }),
    ]);
    return this.paginate(items, total, query.page, query.limit);
  }

  private async assertLeaveBalance(userId: string, leaveTypeId: string, year: number, totalDays: number): Promise<void> {
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
    });
    if (!balance || Number(balance.balanceDays) - Number(balance.usedDays) < totalDays) {
      throw badRequest('LEAVE_BALANCE_INSUFFICIENT', 'Khong du ngay phep');
    }
  }

  private async assertNoLeaveOverlap(userId: string, startDate: Date, endDate: Date): Promise<void> {
    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap) throw badRequest('LEAVE_REQUEST_OVERLAP', 'Don nghi bi trung thoi gian');
  }

  private async assertNoOvertimeOverlap(userId: string, startAt: Date, endAt: Date): Promise<void> {
    const overlap = await this.prisma.overtimeRequest.findFirst({
      where: {
        userId,
        status: { in: [OvertimeRequestStatus.PENDING, OvertimeRequestStatus.APPROVED] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (overlap) throw badRequest('OVERTIME_REQUEST_OVERLAP', 'Don tang ca bi trung thoi gian');
  }

  private departmentFilter(
    requestedDepartmentId: string | undefined,
    visibleDepartmentIds: string[] | null,
  ): string | { in: string[] } | undefined {
    if (visibleDepartmentIds === null) return requestedDepartmentId;
    if (requestedDepartmentId) {
      return visibleDepartmentIds.includes(requestedDepartmentId)
        ? requestedDepartmentId
        : { in: ['00000000-0000-0000-0000-000000000000'] };
    }
    return { in: visibleDepartmentIds.length ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'] };
  }

  private paginate<T>(items: T[], total: number, page: number, limit: number) {
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
