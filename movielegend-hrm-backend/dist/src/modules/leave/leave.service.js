"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const business_time_service_1 = require("../time/business-time.service");
let LeaveService = class LeaveService {
    prisma;
    scope;
    notifications;
    businessTime;
    constructor(prisma, scope, notifications = {
        createForUsers: async () => null,
        emitCreated: () => undefined,
    }, businessTime = new business_time_service_1.BusinessTimeService()) {
        this.prisma = prisma;
        this.scope = scope;
        this.notifications = notifications;
        this.businessTime = businessTime;
    }
    createLeaveType(dto) {
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
    async createLeaveRequest(dto, actor) {
        const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
        const startDate = this.businessTime.startOfBusinessDate(dto.startDate);
        const endDate = this.businessTime.startOfBusinessDate(dto.endDate);
        if (endDate < startDate)
            throw (0, error_util_1.badRequest)('INVALID_LEAVE_DATE_RANGE', 'Ngay ket thuc phai sau ngay bat dau');
        const leaveType = await this.prisma.leaveType.findFirst({
            where: { id: dto.leaveTypeId, isActive: true },
        });
        if (!leaveType)
            throw (0, error_util_1.notFound)('LEAVE_TYPE_NOT_FOUND', 'Khong tim thay loai nghi phep');
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
                    type: client_1.EmployeeRequestType.LEAVE,
                    title: 'Don nghi phep',
                    content: dto.reason,
                    referenceId: request.id,
                },
            });
            return request;
        });
    }
    findLeaveRequests(actor, query) {
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
    approveLeave(id, actor) {
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.findUnique({ where: { id } });
            if (!request)
                throw (0, error_util_1.notFound)('LEAVE_REQUEST_NOT_FOUND', 'Khong tim thay don nghi');
            this.scope.assertDepartmentAccess(actor, request.departmentId);
            if (request.status !== client_1.LeaveRequestStatus.PENDING) {
                throw (0, error_util_1.badRequest)('LEAVE_ALREADY_PROCESSED', 'Don nghi da duoc xu ly');
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
                throw (0, error_util_1.badRequest)('LEAVE_BALANCE_INSUFFICIENT', 'Khong du ngay phep');
            }
            const approved = await tx.leaveRequest.update({
                where: { id },
                data: { status: client_1.LeaveRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
            });
            await tx.leaveBalance.update({
                where: { id: balance.id },
                data: { usedDays: { increment: request.totalDays } },
            });
            await tx.employeeRequest.updateMany({
                where: { referenceId: id, type: client_1.EmployeeRequestType.LEAVE },
                data: { status: client_1.EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
            });
            return approved;
        }, {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
        });
    }
    async rejectLeave(id, dto, actor) {
        const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
        if (!request)
            throw (0, error_util_1.notFound)('LEAVE_REQUEST_NOT_FOUND', 'Khong tim thay don nghi');
        this.scope.assertDepartmentAccess(actor, request.departmentId);
        if (request.status !== client_1.LeaveRequestStatus.PENDING) {
            throw (0, error_util_1.badRequest)('LEAVE_ALREADY_PROCESSED', 'Don nghi da duoc xu ly');
        }
        return this.prisma.$transaction(async (tx) => {
            const rejected = await tx.leaveRequest.update({
                where: { id },
                data: {
                    status: client_1.LeaveRequestStatus.REJECTED,
                    rejectionReason: dto.reason,
                    decidedByUserId: actor.userId,
                    decidedAt: new Date(),
                },
            });
            await tx.employeeRequest.updateMany({
                where: { referenceId: id, type: client_1.EmployeeRequestType.LEAVE },
                data: { status: client_1.EmployeeRequestStatus.REJECTED, decidedByUserId: actor.userId, decidedAt: new Date() },
            });
            return rejected;
        });
    }
    async createOvertimeRequest(dto, actor) {
        const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
        const startAt = new Date(dto.startAt);
        const endAt = new Date(dto.endAt);
        if (endAt <= startAt)
            throw (0, error_util_1.badRequest)('INVALID_OVERTIME_TIME_RANGE', 'Gio ket thuc tang ca phai sau gio bat dau');
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
    async approveOvertime(id, actor) {
        const request = await this.prisma.overtimeRequest.findUnique({ where: { id } });
        if (!request)
            throw (0, error_util_1.notFound)('OVERTIME_REQUEST_NOT_FOUND', 'Khong tim thay don tang ca');
        this.scope.assertDepartmentAccess(actor, request.departmentId);
        if (request.status !== client_1.OvertimeRequestStatus.PENDING) {
            throw (0, error_util_1.badRequest)('OVERTIME_REQUEST_INVALID_STATE', 'Don tang ca khong con cho duyet');
        }
        return this.prisma.overtimeRequest.update({
            where: { id },
            data: { status: client_1.OvertimeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
        });
    }
    async rejectOvertime(id, dto, actor) {
        const request = await this.prisma.overtimeRequest.findUnique({ where: { id } });
        if (!request)
            throw (0, error_util_1.notFound)('OVERTIME_REQUEST_NOT_FOUND', 'Khong tim thay don tang ca');
        this.scope.assertDepartmentAccess(actor, request.departmentId);
        if (request.status !== client_1.OvertimeRequestStatus.PENDING) {
            throw (0, error_util_1.badRequest)('OVERTIME_REQUEST_INVALID_STATE', 'Don tang ca khong con cho duyet');
        }
        const payload = await this.prisma.$transaction(async (tx) => {
            const rejected = await tx.overtimeRequest.update({
                where: { id },
                data: {
                    status: client_1.OvertimeRequestStatus.REJECTED,
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
                type: client_1.NotificationType.SYSTEM,
                title: 'Overtime request rejected',
                body: dto.reason,
                metadata: { overtimeRequestId: id },
            });
            return { rejected, notification };
        });
        this.notifications.emitCreated(payload.notification);
        return payload.rejected;
    }
    findMyOvertimeRequests(actor, query) {
        const where = {
            userId: actor.userId,
            ...(query.status ? { status: query.status } : {}),
            ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
                ? { workDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
                : {}),
        };
        return this.paginatedOvertime(where, query);
    }
    findPendingOvertimeRequests(actor, query) {
        const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
        const departmentFilter = this.departmentFilter(undefined, visibleDepartmentIds);
        const where = {
            status: query.status ?? client_1.OvertimeRequestStatus.PENDING,
            ...(departmentFilter ? { departmentId: departmentFilter } : {}),
            ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
                ? { workDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
                : {}),
        };
        return this.paginatedOvertime(where, query);
    }
    async paginatedOvertime(where, query) {
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
    async assertLeaveBalance(userId, leaveTypeId, year, totalDays) {
        const balance = await this.prisma.leaveBalance.findUnique({
            where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
        });
        if (!balance || Number(balance.balanceDays) - Number(balance.usedDays) < totalDays) {
            throw (0, error_util_1.badRequest)('LEAVE_BALANCE_INSUFFICIENT', 'Khong du ngay phep');
        }
    }
    async assertNoLeaveOverlap(userId, startDate, endDate) {
        const overlap = await this.prisma.leaveRequest.findFirst({
            where: {
                userId,
                status: { in: [client_1.LeaveRequestStatus.PENDING, client_1.LeaveRequestStatus.APPROVED] },
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });
        if (overlap)
            throw (0, error_util_1.badRequest)('LEAVE_REQUEST_OVERLAP', 'Don nghi bi trung thoi gian');
    }
    async assertNoOvertimeOverlap(userId, startAt, endAt) {
        const overlap = await this.prisma.overtimeRequest.findFirst({
            where: {
                userId,
                status: { in: [client_1.OvertimeRequestStatus.PENDING, client_1.OvertimeRequestStatus.APPROVED] },
                startAt: { lt: endAt },
                endAt: { gt: startAt },
            },
        });
        if (overlap)
            throw (0, error_util_1.badRequest)('OVERTIME_REQUEST_OVERLAP', 'Don tang ca bi trung thoi gian');
    }
    departmentFilter(requestedDepartmentId, visibleDepartmentIds) {
        if (visibleDepartmentIds === null)
            return requestedDepartmentId;
        if (requestedDepartmentId) {
            return visibleDepartmentIds.includes(requestedDepartmentId)
                ? requestedDepartmentId
                : { in: ['00000000-0000-0000-0000-000000000000'] };
        }
        return { in: visibleDepartmentIds.length ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'] };
    }
    paginate(items, total, page, limit) {
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
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        notifications_service_1.NotificationsService,
        business_time_service_1.BusinessTimeService])
], LeaveService);
//# sourceMappingURL=leave.service.js.map