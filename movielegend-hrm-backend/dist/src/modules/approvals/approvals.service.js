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
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const approval_policy_service_1 = require("./approval-policy.service");
let ApprovalsService = class ApprovalsService {
    prisma;
    policy;
    constructor(prisma, policy) {
        this.prisma = prisma;
        this.policy = policy;
    }
    async findAll(actor, query) {
        const visibleDepartmentIds = this.policy.visibleDepartmentIds(actor);
        const requestedDepartmentFilter = this.buildDepartmentFilter(query.departmentId, visibleDepartmentIds);
        const where = {
            ...(query.status ? { status: query.status } : {}),
            ...(requestedDepartmentFilter ? { requestedDepartmentId: requestedDepartmentFilter } : {}),
            ...(query.search
                ? {
                    user: {
                        OR: [
                            { phone: { contains: query.search, mode: 'insensitive' } },
                            { userCode: { contains: query.search, mode: 'insensitive' } },
                            { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
                        ],
                    },
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.userApprovalRequest.findMany({
                where,
                include: {
                    requestedDepartment: true,
                    user: {
                        select: {
                            id: true,
                            userCode: true,
                            phone: true,
                            email: true,
                            accountStatus: true,
                            approvalStatus: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                            profile: true,
                        },
                    },
                    histories: { orderBy: { createdAt: 'asc' } },
                },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.userApprovalRequest.count({ where }),
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
    approve(id, actor) {
        return this.prisma.$transaction(async (tx) => {
            const request = await this.findPendingRequest(tx, id);
            if (!this.policy.canApproveDepartment(actor, request.requestedDepartmentId)) {
                throw (0, error_util_1.forbidden)('APPROVAL_SCOPE_DENIED', 'Bạn không có quyền duyệt phòng ban này');
            }
            await tx.userApprovalRequest.update({
                where: { id },
                data: {
                    status: client_1.ApprovalStatus.APPROVED,
                    decidedByUserId: actor.userId,
                    decidedAt: new Date(),
                },
            });
            await tx.user.update({
                where: { id: request.userId },
                data: {
                    approvalStatus: client_1.ApprovalStatus.APPROVED,
                    accountStatus: client_1.AccountStatus.ACTIVE,
                    isActive: true,
                },
            });
            await tx.departmentMember.upsert({
                where: {
                    departmentId_userId: {
                        departmentId: request.requestedDepartmentId,
                        userId: request.userId,
                    },
                },
                create: {
                    departmentId: request.requestedDepartmentId,
                    userId: request.userId,
                    isPrimary: true,
                },
                update: { leftAt: null, isPrimary: true },
            });
            await tx.approvalHistory.create({
                data: {
                    approvalRequestId: id,
                    actorUserId: actor.userId,
                    action: client_1.ApprovalAction.APPROVED,
                    note: 'Tài khoản được duyệt',
                },
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'approval.account.approve',
                    entityType: 'UserApprovalRequest',
                    entityId: id,
                    metadata: { userId: request.userId, departmentId: request.requestedDepartmentId },
                },
            });
            return { id, status: client_1.ApprovalStatus.APPROVED };
        });
    }
    reject(id, dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const request = await this.findPendingRequest(tx, id);
            if (!this.policy.canApproveDepartment(actor, request.requestedDepartmentId)) {
                throw (0, error_util_1.forbidden)('APPROVAL_SCOPE_DENIED', 'Bạn không có quyền từ chối phòng ban này');
            }
            await tx.userApprovalRequest.update({
                where: { id },
                data: {
                    status: client_1.ApprovalStatus.REJECTED,
                    rejectionReason: dto.reason,
                    decidedByUserId: actor.userId,
                    decidedAt: new Date(),
                },
            });
            await tx.user.update({
                where: { id: request.userId },
                data: {
                    approvalStatus: client_1.ApprovalStatus.REJECTED,
                    isActive: false,
                },
            });
            await tx.approvalHistory.create({
                data: {
                    approvalRequestId: id,
                    actorUserId: actor.userId,
                    action: client_1.ApprovalAction.REJECTED,
                    note: dto.reason,
                },
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'approval.account.reject',
                    entityType: 'UserApprovalRequest',
                    entityId: id,
                    metadata: { reason: dto.reason },
                },
            });
            return { id, status: client_1.ApprovalStatus.REJECTED };
        });
    }
    async findPendingRequest(tx, id) {
        const request = await tx.userApprovalRequest.findUnique({ where: { id } });
        if (!request)
            throw (0, error_util_1.notFound)('APPROVAL_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu duyệt');
        if (request.status !== client_1.ApprovalStatus.PENDING) {
            throw (0, error_util_1.badRequest)('APPROVAL_REQUEST_NOT_PENDING', 'Yêu cầu không còn ở trạng thái chờ duyệt');
        }
        return request;
    }
    buildDepartmentFilter(requestedDepartmentId, visibleDepartmentIds) {
        if (visibleDepartmentIds === null)
            return requestedDepartmentId;
        if (requestedDepartmentId) {
            return visibleDepartmentIds.includes(requestedDepartmentId)
                ? requestedDepartmentId
                : { in: ['00000000-0000-0000-0000-000000000000'] };
        }
        return { in: visibleDepartmentIds.length ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'] };
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approval_policy_service_1.ApprovalPolicyService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map