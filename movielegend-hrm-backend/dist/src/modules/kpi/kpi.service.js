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
exports.KpiService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
const kpi_scoring_service_1 = require("./kpi-scoring.service");
let KpiService = class KpiService {
    prisma;
    scope;
    notifications;
    realtime;
    scoring;
    constructor(prisma, scope, notifications, realtime, scoring) {
        this.prisma = prisma;
        this.scope = scope;
        this.notifications = notifications;
        this.realtime = realtime;
        this.scoring = scoring;
    }
    async createTemplate(dto, actor) {
        if (dto.departmentId)
            this.scope.assertDepartmentAccess(actor, dto.departmentId);
        const template = await this.prisma.kpiTemplate.create({ data: { ...dto, createdById: actor.userId }, include: { criteria: true } });
        await this.prisma.auditLog.create({ data: { actorUserId: actor.userId, action: 'KPI_TEMPLATE_CREATED', entityType: 'KpiTemplate', entityId: template.id } });
        return template;
    }
    findTemplates() {
        return this.prisma.kpiTemplate.findMany({ where: { deletedAt: null }, include: { criteria: true }, orderBy: { createdAt: 'desc' } });
    }
    async findTemplate(id) {
        const template = await this.prisma.kpiTemplate.findUnique({ where: { id }, include: { criteria: true } });
        if (!template || template.deletedAt)
            throw (0, error_util_1.notFound)('KPI_TEMPLATE_NOT_FOUND', 'KPI template not found');
        return template;
    }
    updateTemplate(id, dto) {
        return this.prisma.kpiTemplate.update({ where: { id }, data: dto, include: { criteria: true } });
    }
    async addCriteria(templateId, dto) {
        await this.findTemplate(templateId);
        return this.prisma.kpiCriteria.create({
            data: {
                kpiTemplateId: templateId,
                code: dto.code,
                name: dto.name,
                description: dto.description,
                weight: dto.weight,
                targetValue: dto.targetValue,
                unit: dto.unit,
                scoringMethod: dto.scoringMethod,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }
    async assign(dto, actor) {
        const [template, targetDepartmentId] = await Promise.all([
            this.findTemplate(dto.kpiTemplateId),
            this.scope.getPrimaryDepartmentId(dto.userId),
        ]);
        this.scope.assertDepartmentAccess(actor, targetDepartmentId);
        this.scoring.validateWeightTotal(template.criteria);
        if (new Date(dto.periodEnd) < new Date(dto.periodStart))
            throw (0, error_util_1.badRequest)('KPI_PERIOD_INVALID', 'KPI period end must be after start');
        const payload = await this.prisma.$transaction(async (tx) => {
            const assignment = await tx.employeeKpiAssignment.create({
                data: {
                    userId: dto.userId,
                    kpiTemplateId: dto.kpiTemplateId,
                    periodStart: new Date(dto.periodStart),
                    periodEnd: new Date(dto.periodEnd),
                    status: client_1.EmployeeKpiAssignmentStatus.ACTIVE,
                    assignedById: actor.userId,
                    results: {
                        create: template.criteria.map((criteria) => ({
                            criteriaId: criteria.id,
                            targetValue: criteria.targetValue,
                        })),
                    },
                },
                include: this.include(),
            });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'KPI_ASSIGNED', entityType: 'EmployeeKpiAssignment', entityId: assignment.id } });
            const notification = await this.notifications.createForUsers(tx, [dto.userId], {
                type: client_1.NotificationType.KPI_ASSIGNED,
                title: 'KPI assigned',
                body: template.name,
                metadata: { assignmentId: assignment.id },
            });
            return { assignment, notification };
        });
        this.notifications.emitCreated(payload.notification);
        this.realtime.emitToUser(dto.userId, 'kpi:assigned', { id: payload.assignment.id, status: payload.assignment.status });
        return payload.assignment;
    }
    findMine(actor) {
        return this.prisma.employeeKpiAssignment.findMany({ where: { userId: actor.userId }, include: this.include(), orderBy: { periodStart: 'desc' } });
    }
    async findDepartment(departmentId, actor) {
        this.scope.assertDepartmentAccess(actor, departmentId);
        const members = await this.prisma.departmentMember.findMany({ where: { departmentId, leftAt: null }, select: { userId: true } });
        return this.prisma.employeeKpiAssignment.findMany({ where: { userId: { in: members.map((member) => member.userId) } }, include: this.include(), orderBy: { periodStart: 'desc' } });
    }
    async findOne(id, actor) {
        const assignment = await this.prisma.employeeKpiAssignment.findUnique({ where: { id }, include: this.include() });
        if (!assignment)
            throw (0, error_util_1.notFound)('KPI_ASSIGNMENT_NOT_FOUND', 'KPI assignment not found');
        await this.assertCanRead(assignment.userId, actor);
        return assignment;
    }
    async updateResults(id, dto, actor) {
        const assignment = await this.findOne(id, actor);
        if (assignment.status === client_1.EmployeeKpiAssignmentStatus.FINALIZED)
            throw (0, error_util_1.badRequest)('KPI_FINALIZED_IMMUTABLE', 'Finalized KPI cannot be changed');
        if (assignment.userId !== actor.userId && !this.has(actor, 'kpi.leader_review') && !this.has(actor, 'kpi.finalize')) {
            throw (0, error_util_1.forbidden)('KPI_UPDATE_FORBIDDEN', 'Cannot update this KPI result');
        }
        return this.prisma.$transaction(async (tx) => {
            for (const item of dto.results) {
                await tx.employeeKpiResult.update({
                    where: { employeeKpiAssignmentId_criteriaId: { employeeKpiAssignmentId: id, criteriaId: item.criteriaId } },
                    data: {
                        actualValue: item.actualValue,
                        employeeScore: item.employeeScore,
                        leaderScore: item.leaderScore,
                        finalScore: item.finalScore,
                        employeeComment: item.employeeComment,
                        leaderComment: item.leaderComment,
                        finalComment: item.finalComment,
                        evidenceUrl: item.evidenceUrl,
                    },
                });
            }
            return tx.employeeKpiAssignment.findUniqueOrThrow({ where: { id }, include: this.include() });
        });
    }
    submitSelf(id, actor) {
        return this.changeStatus(id, actor, client_1.EmployeeKpiAssignmentStatus.ACTIVE, client_1.EmployeeKpiAssignmentStatus.LEADER_REVIEW, 'KPI_SELF_SUBMITTED', client_1.NotificationType.KPI_LEADER_REVIEW_REQUIRED, { ownOnly: true, submittedAt: new Date() });
    }
    leaderReview(id, actor) {
        return this.changeStatus(id, actor, client_1.EmployeeKpiAssignmentStatus.LEADER_REVIEW, client_1.EmployeeKpiAssignmentStatus.FINAL_REVIEW, 'KPI_LEADER_REVIEWED', client_1.NotificationType.KPI_SELF_REVIEW_REQUIRED, { departmentOnly: true, reviewedAt: new Date() });
    }
    async finalize(id, actor) {
        const assignment = await this.prisma.employeeKpiAssignment.findUnique({ where: { id }, include: this.include() });
        if (!assignment)
            throw (0, error_util_1.notFound)('KPI_ASSIGNMENT_NOT_FOUND', 'KPI assignment not found');
        if (assignment.status !== client_1.EmployeeKpiAssignmentStatus.FINAL_REVIEW)
            throw (0, error_util_1.badRequest)('KPI_FINALIZE_WRONG_STATE', 'KPI is not ready for finalization');
        const taskSummary = await this.taskSummary(assignment.userId, assignment.periodStart, assignment.periodEnd);
        const score = this.scoring.calculateWeightedScore(assignment.results.map((result) => ({
            weight: result.criteria.weight,
            score: result.finalScore ?? result.leaderScore ?? result.employeeScore ?? this.scoring.scoreByMethod(result.criteria.scoringMethod, result.actualValue, result.targetValue),
        })));
        const payload = await this.prisma.$transaction(async (tx) => {
            const changed = await tx.employeeKpiAssignment.updateMany({
                where: { id, status: client_1.EmployeeKpiAssignmentStatus.FINAL_REVIEW },
                data: { status: client_1.EmployeeKpiAssignmentStatus.FINALIZED, finalizedAt: new Date(), finalScore: score.score, snapshot: { score, taskSummary } },
            });
            if (changed.count !== 1)
                throw (0, error_util_1.conflict)('KPI_STATE_CONFLICT', 'KPI state already changed');
            const updated = await tx.employeeKpiAssignment.findUniqueOrThrow({ where: { id }, include: this.include() });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'KPI_FINALIZED', entityType: 'EmployeeKpiAssignment', entityId: id, metadata: { finalScore: score.score } } });
            const notification = await this.notifications.createForUsers(tx, [updated.userId], {
                type: client_1.NotificationType.KPI_FINALIZED,
                title: 'KPI finalized',
                body: updated.kpiTemplate.name,
                metadata: { assignmentId: id, finalScore: score.score },
            });
            return { updated, notification };
        });
        this.notifications.emitCreated(payload.notification);
        this.realtime.emitToUser(payload.updated.userId, 'kpi:updated', { id, status: payload.updated.status });
        return payload.updated;
    }
    async changeStatus(id, actor, from, to, auditAction, notificationType, options) {
        const assignment = await this.prisma.employeeKpiAssignment.findUnique({ where: { id } });
        if (!assignment)
            throw (0, error_util_1.notFound)('KPI_ASSIGNMENT_NOT_FOUND', 'KPI assignment not found');
        if (options.ownOnly && assignment.userId !== actor.userId)
            throw (0, error_util_1.forbidden)('KPI_SELF_REVIEW_FORBIDDEN', 'Cannot submit another employee KPI');
        if (options.departmentOnly) {
            const departmentId = await this.scope.getPrimaryDepartmentId(assignment.userId);
            this.scope.assertDepartmentAccess(actor, departmentId);
        }
        const payload = await this.prisma.$transaction(async (tx) => {
            const changed = await tx.employeeKpiAssignment.updateMany({ where: { id, status: from }, data: { status: to, submittedAt: options.submittedAt, reviewedAt: options.reviewedAt } });
            if (changed.count !== 1)
                throw (0, error_util_1.conflict)('KPI_STATE_CONFLICT', 'KPI state already changed');
            const updated = await tx.employeeKpiAssignment.findUniqueOrThrow({ where: { id }, include: this.include() });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: auditAction, entityType: 'EmployeeKpiAssignment', entityId: id, metadata: { from, to } } });
            const notification = await this.notifications.createForUsers(tx, [updated.userId], {
                type: notificationType,
                title: 'KPI updated',
                body: updated.kpiTemplate.name,
                metadata: { assignmentId: id, status: to },
            });
            return { updated, notification };
        });
        this.notifications.emitCreated(payload.notification);
        this.realtime.emitToUser(payload.updated.userId, 'kpi:updated', { id, status: to });
        return payload.updated;
    }
    async assertCanRead(userId, actor) {
        if (userId === actor.userId && this.has(actor, 'kpi.read_own'))
            return;
        if (this.has(actor, 'kpi.read_all'))
            return;
        if (this.has(actor, 'kpi.read_department')) {
            const departmentId = await this.scope.getPrimaryDepartmentId(userId);
            this.scope.assertDepartmentAccess(actor, departmentId);
            return;
        }
        throw (0, error_util_1.forbidden)('KPI_IDOR_DENIED', 'Cannot read this KPI assignment');
    }
    async taskSummary(userId, periodStart, periodEnd) {
        const assignments = await this.prisma.taskAssignment.findMany({
            where: { userId, createdAt: { gte: periodStart, lte: periodEnd } },
            select: { status: true, assignmentDueAt: true, completedAt: true },
        });
        const completed = assignments.filter((item) => item.status === client_1.TaskAssignmentStatus.COMPLETED).length;
        const rejected = assignments.filter((item) => item.status === client_1.TaskAssignmentStatus.REJECTED).length;
        const overdue = assignments.filter((item) => item.assignmentDueAt && (!item.completedAt || item.completedAt > item.assignmentDueAt)).length;
        return { total: assignments.length, completed, rejected, overdue, completionRate: assignments.length ? completed / assignments.length : 0 };
    }
    include() {
        return { kpiTemplate: { include: { criteria: true } }, results: { include: { criteria: true } }, user: { include: { profile: true } } };
    }
    has(actor, permission) {
        return actor.permissions.includes(permission);
    }
};
exports.KpiService = KpiService;
exports.KpiService = KpiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService,
        kpi_scoring_service_1.KpiScoringService])
], KpiService);
//# sourceMappingURL=kpi.service.js.map