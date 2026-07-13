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
exports.EmployeeRequestsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const business_time_service_1 = require("../time/business-time.service");
const notifications_service_1 = require("../notifications/notifications.service");
let EmployeeRequestsService = class EmployeeRequestsService {
    prisma;
    scope;
    businessTime;
    notifications;
    constructor(prisma, scope, businessTime, notifications) {
        this.prisma = prisma;
        this.scope = scope;
        this.businessTime = businessTime;
        this.notifications = notifications;
    }
    async create(dto, actor) {
        const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
        this.assertFinancialRequest(dto);
        return this.prisma.employeeRequest.create({
            data: {
                userId: actor.userId,
                departmentId,
                type: dto.type,
                title: dto.title,
                content: dto.content,
                amount: dto.amount,
                attachmentMetadata: dto.attachmentMetadata,
                referenceId: dto.referenceId,
            },
        });
    }
    findAll(actor, departmentId) {
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
    async findMine(actor, query) {
        const where = {
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
    async approve(id, actor) {
        const request = await this.prisma.employeeRequest.findUnique({ where: { id } });
        if (!request)
            throw (0, error_util_1.notFound)('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');
        this.scope.assertDepartmentAccess(actor, request.departmentId);
        if (request.status !== client_1.EmployeeRequestStatus.PENDING) {
            throw (0, error_util_1.badRequest)('EMPLOYEE_REQUEST_NOT_PENDING', 'Yêu cầu không còn chờ duyệt');
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.employeeRequest.update({
                where: { id },
                data: { status: client_1.EmployeeRequestStatus.APPROVED, decidedByUserId: actor.userId, decidedAt: new Date() },
            });
            const notif = await this.notifications.createForUsers(tx, [request.userId], {
                type: client_1.NotificationType.SYSTEM,
                title: 'Yêu cầu đã được duyệt',
                body: `Yêu cầu "${request.title}" của bạn đã được duyệt.`,
                metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
            return updated;
        });
    }
    async reject(id, actor) {
        const request = await this.prisma.employeeRequest.findUnique({ where: { id } });
        if (!request)
            throw (0, error_util_1.notFound)('EMPLOYEE_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu nhân viên');
        this.scope.assertDepartmentAccess(actor, request.departmentId);
        if (request.status !== client_1.EmployeeRequestStatus.PENDING) {
            throw (0, error_util_1.badRequest)('EMPLOYEE_REQUEST_NOT_PENDING', 'Yêu cầu không còn chờ duyệt');
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.employeeRequest.update({
                where: { id },
                data: { status: client_1.EmployeeRequestStatus.REJECTED, decidedByUserId: actor.userId, decidedAt: new Date() },
            });
            const notif = await this.notifications.createForUsers(tx, [request.userId], {
                type: client_1.NotificationType.SYSTEM,
                title: 'Yêu cầu bị từ chối',
                body: `Yêu cầu "${request.title}" của bạn đã bị từ chối.`,
                metadata: { requestId: id },
            });
            this.notifications.emitCreated(notif);
            return updated;
        });
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
    assertFinancialRequest(dto) {
        const financialTypes = new Set([
            client_1.EmployeeRequestType.ADVANCE,
            client_1.EmployeeRequestType.EXPENSE,
            client_1.EmployeeRequestType.PURCHASE,
        ]);
        if (financialTypes.has(dto.type) && (dto.amount === undefined || dto.amount <= 0)) {
            throw (0, error_util_1.badRequest)('EMPLOYEE_REQUEST_AMOUNT_REQUIRED', 'Yêu cầu tài chính phải có số tiền hợp lệ');
        }
    }
};
exports.EmployeeRequestsService = EmployeeRequestsService;
exports.EmployeeRequestsService = EmployeeRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        business_time_service_1.BusinessTimeService,
        notifications_service_1.NotificationsService])
], EmployeeRequestsService);
//# sourceMappingURL=employee-requests.service.js.map