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
exports.CrossDepartmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
let CrossDepartmentService = class CrossDepartmentService {
    prisma;
    scope;
    notifications;
    constructor(prisma, scope, notifications) {
        this.prisma = prisma;
        this.scope = scope;
        this.notifications = notifications;
    }
    async create(dto, actor) {
        await this.scope.assertUserInDepartment(actor.userId, dto.sourceDepartmentId);
        const payload = await this.prisma.$transaction(async (tx) => {
            const requestCode = await this.prisma.nextCrossDepartmentRequestCode(tx);
            const request = await tx.crossDepartmentRequest.create({
                data: {
                    requestCode,
                    taskId: dto.taskId,
                    createdByUserId: actor.userId,
                    sourceDepartmentId: dto.sourceDepartmentId,
                    targetDepartmentId: dto.targetDepartmentId,
                    title: dto.title,
                    content: dto.content,
                },
            });
            const sourceLeaders = await tx.department.findUnique({
                where: { id: dto.sourceDepartmentId },
                select: { leaderUserId: true },
            });
            const notification = await this.notifications.createForUsers(tx, sourceLeaders?.leaderUserId ? [sourceLeaders.leaderUserId] : [], {
                type: client_1.NotificationType.CROSS_DEPARTMENT_REQUESTED,
                title: 'Cross-department request pending',
                body: dto.title,
                taskId: dto.taskId,
            });
            return { request, notification };
        });
        this.notifications.emitCreated(payload.notification);
        return payload.request;
    }
    findAll(actor) {
        if (actor.roles.includes('ADMIN')) {
            return this.prisma.crossDepartmentRequest.findMany({ orderBy: { createdAt: 'desc' } });
        }
        const visible = this.scope.visibleDepartmentIds(actor) ?? [];
        return this.prisma.crossDepartmentRequest.findMany({
            where: { OR: [{ sourceDepartmentId: { in: visible } }, { targetDepartmentId: { in: visible } }, { createdByUserId: actor.userId }] },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, actor) {
        const request = await this.prisma.crossDepartmentRequest.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
                decidedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
                sourceDepartment: { select: { id: true, code: true, name: true } },
                targetDepartment: { select: { id: true, code: true, name: true } },
                task: { select: { id: true, taskCode: true, title: true, status: true, priority: true, dueAt: true } },
            },
        });
        if (!request)
            throw (0, error_util_1.notFound)('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
        if (!this.canView(request, actor)) {
            throw (0, error_util_1.forbidden)('CROSS_DEPARTMENT_REQUEST_FORBIDDEN', 'Cannot access cross-department request');
        }
        return {
            ...request,
            requester: request.createdBy,
            linkedTask: request.task,
            history: [
                {
                    type: 'REQUEST_CREATED',
                    actor: request.createdBy,
                    createdAt: request.createdAt,
                    status: client_1.CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL,
                },
                ...(request.decidedAt
                    ? [
                        {
                            type: 'REQUEST_DECIDED',
                            actor: request.decidedBy,
                            createdAt: request.decidedAt,
                            status: request.status,
                            reason: request.rejectionReason,
                        },
                    ]
                    : []),
            ],
        };
    }
    approveSource(id, actor) {
        return this.decide(id, actor, client_1.CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL, client_1.CrossDepartmentRequestStatus.SOURCE_APPROVED, 'source');
    }
    rejectSource(id, dto, actor) {
        return this.decide(id, actor, client_1.CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL, client_1.CrossDepartmentRequestStatus.SOURCE_REJECTED, 'source', dto.reason);
    }
    acceptTarget(id, actor) {
        return this.decide(id, actor, client_1.CrossDepartmentRequestStatus.SOURCE_APPROVED, client_1.CrossDepartmentRequestStatus.TARGET_ACCEPTED, 'target');
    }
    rejectTarget(id, dto, actor) {
        return this.decide(id, actor, client_1.CrossDepartmentRequestStatus.SOURCE_APPROVED, client_1.CrossDepartmentRequestStatus.TARGET_REJECTED, 'target', dto.reason);
    }
    async decide(id, actor, expected, next, side, rejectionReason) {
        const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
        if (!request)
            throw (0, error_util_1.notFound)('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
        this.scope.assertDepartmentAccess(actor, side === 'source' ? request.sourceDepartmentId : request.targetDepartmentId);
        if (request.status !== expected)
            throw (0, error_util_1.badRequest)('INVALID_CROSS_DEPARTMENT_STATUS', `Request must be ${expected}`);
        return this.prisma.crossDepartmentRequest.update({
            where: { id },
            data: {
                status: next,
                rejectionReason,
                decidedByUserId: actor.userId,
                decidedAt: new Date(),
            },
        });
    }
    canView(request, actor) {
        if (actor.roles.includes('ADMIN') || actor.permissions.includes('cross_department.read_all'))
            return true;
        if (request.createdByUserId === actor.userId)
            return true;
        const visible = this.scope.visibleDepartmentIds(actor) ?? [];
        return visible.includes(request.sourceDepartmentId) || visible.includes(request.targetDepartmentId);
    }
};
exports.CrossDepartmentService = CrossDepartmentService;
exports.CrossDepartmentService = CrossDepartmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        notifications_service_1.NotificationsService])
], CrossDepartmentService);
//# sourceMappingURL=cross-department.service.js.map