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
exports.PerformanceReviewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
let PerformanceReviewsService = class PerformanceReviewsService {
    prisma;
    scope;
    notifications;
    realtime;
    constructor(prisma, scope, notifications, realtime) {
        this.prisma = prisma;
        this.scope = scope;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    async createCycle(dto, actor) {
        this.assertDates(dto);
        const cycle = await this.prisma.performanceReviewCycle.create({
            data: {
                companyId: dto.companyId,
                code: dto.code,
                name: dto.name,
                periodStart: new Date(dto.periodStart),
                periodEnd: new Date(dto.periodEnd),
                selfReviewStart: new Date(dto.selfReviewStart),
                selfReviewEnd: new Date(dto.selfReviewEnd),
                leaderReviewStart: new Date(dto.leaderReviewStart),
                leaderReviewEnd: new Date(dto.leaderReviewEnd),
                finalReviewStart: new Date(dto.finalReviewStart),
                finalReviewEnd: new Date(dto.finalReviewEnd),
                createdById: actor.userId,
            },
        });
        await this.prisma.auditLog.create({ data: { actorUserId: actor.userId, action: 'REVIEW_CYCLE_CREATED', entityType: 'PerformanceReviewCycle', entityId: cycle.id } });
        return cycle;
    }
    findCycles() {
        return this.prisma.performanceReviewCycle.findMany({ include: { reviews: true, reviewerAssignments: true }, orderBy: { createdAt: 'desc' } });
    }
    async findCycle(id) {
        const cycle = await this.prisma.performanceReviewCycle.findUnique({ where: { id }, include: { reviews: true, reviewerAssignments: true } });
        if (!cycle)
            throw (0, error_util_1.notFound)('REVIEW_CYCLE_NOT_FOUND', 'Review cycle not found');
        return cycle;
    }
    openCycle(id, actor) {
        return this.advanceCycle(id, actor, client_1.PerformanceReviewCycleStatus.DRAFT, client_1.PerformanceReviewCycleStatus.OPEN);
    }
    async advanceStage(id, actor) {
        const cycle = await this.prisma.performanceReviewCycle.findUnique({ where: { id } });
        if (!cycle)
            throw (0, error_util_1.notFound)('REVIEW_CYCLE_NOT_FOUND', 'Review cycle not found');
        const next = {
            DRAFT: client_1.PerformanceReviewCycleStatus.OPEN,
            OPEN: client_1.PerformanceReviewCycleStatus.SELF_REVIEW,
            SELF_REVIEW: client_1.PerformanceReviewCycleStatus.LEADER_REVIEW,
            LEADER_REVIEW: client_1.PerformanceReviewCycleStatus.FINAL_REVIEW,
            FINAL_REVIEW: client_1.PerformanceReviewCycleStatus.CLOSED,
            CLOSED: null,
            CANCELLED: null,
        };
        const to = next[cycle.status];
        if (!to)
            throw (0, error_util_1.badRequest)('REVIEW_CYCLE_FINAL_STATE', 'Review cycle cannot advance');
        return this.advanceCycle(id, actor, cycle.status, to);
    }
    closeCycle(id, actor) {
        return this.advanceCycle(id, actor, client_1.PerformanceReviewCycleStatus.FINAL_REVIEW, client_1.PerformanceReviewCycleStatus.CLOSED);
    }
    async assignReviewer(cycleId, dto) {
        const cycle = await this.findCycle(cycleId);
        if (cycle.status === client_1.PerformanceReviewCycleStatus.CLOSED)
            throw (0, error_util_1.badRequest)('REVIEW_CYCLE_CLOSED', 'Review cycle is closed');
        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.reviewerAssignment.create({ data: { reviewCycleId: cycleId, ...dto } });
            await tx.performanceReview.upsert({
                where: { cycleId_userId: { cycleId, userId: dto.employeeUserId } },
                update: { reviewerUserId: dto.reviewerUserId },
                create: { cycleId, userId: dto.employeeUserId, reviewerUserId: dto.reviewerUserId },
            });
            return assignment;
        });
    }
    findMine(actor) {
        return this.prisma.performanceReview.findMany({ where: { userId: actor.userId }, include: this.include(), orderBy: { createdAt: 'desc' } });
    }
    async findDepartment(departmentId, actor) {
        this.scope.assertDepartmentAccess(actor, departmentId);
        const members = await this.prisma.departmentMember.findMany({ where: { departmentId, leftAt: null }, select: { userId: true } });
        return this.prisma.performanceReview.findMany({ where: { userId: { in: members.map((member) => member.userId) } }, include: this.include(), orderBy: { createdAt: 'desc' } });
    }
    async findOne(id, actor) {
        const review = await this.prisma.performanceReview.findUnique({ where: { id }, include: this.include() });
        if (!review)
            throw (0, error_util_1.notFound)('PERFORMANCE_REVIEW_NOT_FOUND', 'Performance review not found');
        await this.assertCanRead(review.userId, actor);
        return review;
    }
    async selfSubmit(id, dto, actor) {
        const review = await this.prisma.performanceReview.findUnique({ where: { id } });
        if (!review)
            throw (0, error_util_1.notFound)('PERFORMANCE_REVIEW_NOT_FOUND', 'Performance review not found');
        if (review.userId !== actor.userId)
            throw (0, error_util_1.forbidden)('PERFORMANCE_REVIEW_SELF_FORBIDDEN', 'Cannot self-submit another employee review');
        return this.updateReviewStatus(id, actor, client_1.PerformanceReviewStatus.PENDING, client_1.PerformanceReviewStatus.LEADER_REVIEW, {
            selfSummary: dto.summary,
            selfScore: dto.score,
            submittedAt: new Date(),
        });
    }
    async leaderSubmit(id, dto, actor) {
        const review = await this.prisma.performanceReview.findUnique({ where: { id } });
        if (!review)
            throw (0, error_util_1.notFound)('PERFORMANCE_REVIEW_NOT_FOUND', 'Performance review not found');
        const assignment = await this.prisma.reviewerAssignment.findFirst({
            where: { reviewCycleId: review.cycleId, employeeUserId: review.userId, reviewerUserId: actor.userId, reviewerType: { in: [client_1.ReviewerType.DIRECT_LEADER, client_1.ReviewerType.SECOND_LEVEL] } },
        });
        if (!assignment)
            throw (0, error_util_1.forbidden)('PERFORMANCE_REVIEW_REVIEWER_DENIED', 'Reviewer is not assigned to this employee');
        const departmentId = await this.scope.getPrimaryDepartmentId(review.userId);
        this.scope.assertDepartmentAccess(actor, departmentId);
        return this.updateReviewStatus(id, actor, client_1.PerformanceReviewStatus.LEADER_REVIEW, client_1.PerformanceReviewStatus.FINAL_REVIEW, {
            leaderSummary: dto.summary,
            leaderScore: dto.score,
            reviewedAt: new Date(),
            reviewerUserId: actor.userId,
        });
    }
    finalize(id, dto, actor) {
        return this.updateReviewStatus(id, actor, client_1.PerformanceReviewStatus.FINAL_REVIEW, client_1.PerformanceReviewStatus.FINALIZED, {
            finalSummary: dto.summary,
            finalScore: dto.score,
            finalizedAt: new Date(),
        });
    }
    async advanceCycle(id, actor, from, to) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const changed = await tx.performanceReviewCycle.updateMany({ where: { id, status: from }, data: { status: to } });
            if (changed.count !== 1)
                throw (0, error_util_1.conflict)('REVIEW_CYCLE_STATE_CONFLICT', 'Review cycle state already changed');
            const cycle = await tx.performanceReviewCycle.findUniqueOrThrow({ where: { id }, include: { reviews: true } });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'PERFORMANCE_REVIEW_STAGE_CHANGED', entityType: 'PerformanceReviewCycle', entityId: id, metadata: { from, to } } });
            const userIds = cycle.reviews.map((review) => review.userId);
            const notification = await this.notifications.createForUsers(tx, userIds, {
                type: to === client_1.PerformanceReviewCycleStatus.OPEN ? client_1.NotificationType.PERFORMANCE_REVIEW_OPENED : client_1.NotificationType.PERFORMANCE_REVIEW_STAGE_CHANGED,
                title: 'Performance review updated',
                body: cycle.name,
                metadata: { cycleId: id, status: to },
            });
            return { cycle, notification };
        });
        this.notifications.emitCreated(payload.notification);
        for (const review of payload.cycle.reviews)
            this.realtime.emitToUser(review.userId, 'performance-review:updated', { cycleId: id, status: to });
        return payload.cycle;
    }
    async updateReviewStatus(id, actor, from, to, data) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const changed = await tx.performanceReview.updateMany({ where: { id, status: from }, data: { status: to, ...data } });
            if (changed.count !== 1)
                throw (0, error_util_1.conflict)('PERFORMANCE_REVIEW_STATE_CONFLICT', 'Performance review state already changed');
            const review = await tx.performanceReview.findUniqueOrThrow({ where: { id }, include: this.include() });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: to === client_1.PerformanceReviewStatus.FINALIZED ? 'PERFORMANCE_REVIEW_FINALIZED' : 'PERFORMANCE_REVIEW_UPDATED',
                    entityType: 'PerformanceReview',
                    entityId: id,
                    metadata: { from, to },
                },
            });
            const notification = await this.notifications.createForUsers(tx, [review.userId], {
                type: to === client_1.PerformanceReviewStatus.FINALIZED ? client_1.NotificationType.PERFORMANCE_REVIEW_FINALIZED : client_1.NotificationType.PERFORMANCE_REVIEW_STAGE_CHANGED,
                title: 'Performance review updated',
                body: review.cycle.name,
                metadata: { reviewId: id, status: to },
            });
            return { review, notification };
        });
        this.notifications.emitCreated(payload.notification);
        this.realtime.emitToUser(payload.review.userId, 'performance-review:updated', { id, status: to });
        return payload.review;
    }
    async assertCanRead(userId, actor) {
        if (userId === actor.userId && this.has(actor, 'performance_review.read_own'))
            return;
        if (this.has(actor, 'performance_review.read_all'))
            return;
        if (this.has(actor, 'performance_review.read_department')) {
            const departmentId = await this.scope.getPrimaryDepartmentId(userId);
            this.scope.assertDepartmentAccess(actor, departmentId);
            return;
        }
        throw (0, error_util_1.forbidden)('PERFORMANCE_REVIEW_IDOR_DENIED', 'Cannot read this performance review');
    }
    assertDates(dto) {
        const pairs = [
            [dto.periodStart, dto.periodEnd],
            [dto.selfReviewStart, dto.selfReviewEnd],
            [dto.leaderReviewStart, dto.leaderReviewEnd],
            [dto.finalReviewStart, dto.finalReviewEnd],
        ];
        if (pairs.some(([start, end]) => new Date(end) < new Date(start)))
            throw (0, error_util_1.badRequest)('REVIEW_CYCLE_DATES_INVALID', 'Review cycle dates are invalid');
    }
    include() {
        return { cycle: true, user: { include: { profile: true } }, reviewer: true };
    }
    has(actor, permission) {
        return actor.permissions.includes(permission);
    }
};
exports.PerformanceReviewsService = PerformanceReviewsService;
exports.PerformanceReviewsService = PerformanceReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService])
], PerformanceReviewsService);
//# sourceMappingURL=performance-reviews.service.js.map