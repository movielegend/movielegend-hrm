import { Injectable } from '@nestjs/common';
import { EmployeeKpiAssignmentStatus, KpiScoringMethod, NotificationType, Prisma, TaskAssignmentStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateKpiAssignmentDto, CreateKpiCriteriaDto, CreateKpiTemplateDto, UpdateKpiResultsDto, UpdateKpiTemplateDto } from './dto/kpi.dto';
import { KpiScoringService } from './kpi-scoring.service';

@Injectable()
export class KpiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
    private readonly scoring: KpiScoringService,
  ) {}

  async createTemplate(dto: CreateKpiTemplateDto, actor: AuthenticatedUser) {
    if (dto.departmentId) this.scope.assertDepartmentAccess(actor, dto.departmentId);
    const template = await this.prisma.kpiTemplate.create({ data: { ...dto, createdById: actor.userId }, include: { criteria: true } });
    await this.prisma.auditLog.create({ data: { actorUserId: actor.userId, action: 'KPI_TEMPLATE_CREATED', entityType: 'KpiTemplate', entityId: template.id } });
    return template;
  }

  findTemplates() {
    return this.prisma.kpiTemplate.findMany({ where: { deletedAt: null }, include: { criteria: true }, orderBy: { createdAt: 'desc' } });
  }

  async findTemplate(id: string) {
    const template = await this.prisma.kpiTemplate.findUnique({ where: { id }, include: { criteria: true } });
    if (!template || template.deletedAt) throw notFound('KPI_TEMPLATE_NOT_FOUND', 'KPI template not found');
    return template;
  }

  updateTemplate(id: string, dto: UpdateKpiTemplateDto) {
    return this.prisma.kpiTemplate.update({ where: { id }, data: dto, include: { criteria: true } });
  }

  async addCriteria(templateId: string, dto: CreateKpiCriteriaDto) {
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

  async assign(dto: CreateKpiAssignmentDto, actor: AuthenticatedUser) {
    const [template, targetDepartmentId] = await Promise.all([
      this.findTemplate(dto.kpiTemplateId),
      this.scope.getPrimaryDepartmentId(dto.userId),
    ]);
    this.scope.assertDepartmentAccess(actor, targetDepartmentId);
    this.scoring.validateWeightTotal(template.criteria);
    if (new Date(dto.periodEnd) < new Date(dto.periodStart)) throw badRequest('KPI_PERIOD_INVALID', 'KPI period end must be after start');
    const payload = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.employeeKpiAssignment.create({
        data: {
          userId: dto.userId,
          kpiTemplateId: dto.kpiTemplateId,
          periodStart: new Date(dto.periodStart),
          periodEnd: new Date(dto.periodEnd),
          status: EmployeeKpiAssignmentStatus.ACTIVE,
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
        type: NotificationType.KPI_ASSIGNED,
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

  findMine(actor: AuthenticatedUser) {
    return this.prisma.employeeKpiAssignment.findMany({ where: { userId: actor.userId }, include: this.include(), orderBy: { periodStart: 'desc' } });
  }

  async findDepartment(departmentId: string, actor: AuthenticatedUser) {
    this.scope.assertDepartmentAccess(actor, departmentId);
    const members = await this.prisma.departmentMember.findMany({ where: { departmentId, leftAt: null }, select: { userId: true } });
    return this.prisma.employeeKpiAssignment.findMany({ where: { userId: { in: members.map((member) => member.userId) } }, include: this.include(), orderBy: { periodStart: 'desc' } });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const assignment = await this.prisma.employeeKpiAssignment.findUnique({ where: { id }, include: this.include() });
    if (!assignment) throw notFound('KPI_ASSIGNMENT_NOT_FOUND', 'KPI assignment not found');
    await this.assertCanRead(assignment.userId, actor);
    return assignment;
  }

  async updateResults(id: string, dto: UpdateKpiResultsDto, actor: AuthenticatedUser) {
    const assignment = await this.findOne(id, actor);
    if (assignment.status === EmployeeKpiAssignmentStatus.FINALIZED) throw badRequest('KPI_FINALIZED_IMMUTABLE', 'Finalized KPI cannot be changed');
    if (assignment.userId !== actor.userId && !this.has(actor, 'kpi.leader_review') && !this.has(actor, 'kpi.finalize')) {
      throw forbidden('KPI_UPDATE_FORBIDDEN', 'Cannot update this KPI result');
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

  submitSelf(id: string, actor: AuthenticatedUser) {
    return this.changeStatus(id, actor, EmployeeKpiAssignmentStatus.ACTIVE, EmployeeKpiAssignmentStatus.LEADER_REVIEW, 'KPI_SELF_SUBMITTED', NotificationType.KPI_LEADER_REVIEW_REQUIRED, { ownOnly: true, submittedAt: new Date() });
  }

  leaderReview(id: string, actor: AuthenticatedUser) {
    return this.changeStatus(id, actor, EmployeeKpiAssignmentStatus.LEADER_REVIEW, EmployeeKpiAssignmentStatus.FINAL_REVIEW, 'KPI_LEADER_REVIEWED', NotificationType.KPI_SELF_REVIEW_REQUIRED, { departmentOnly: true, reviewedAt: new Date() });
  }

  async finalize(id: string, actor: AuthenticatedUser) {
    const assignment = await this.prisma.employeeKpiAssignment.findUnique({ where: { id }, include: this.include() });
    if (!assignment) throw notFound('KPI_ASSIGNMENT_NOT_FOUND', 'KPI assignment not found');
    if (assignment.status !== EmployeeKpiAssignmentStatus.FINAL_REVIEW) throw badRequest('KPI_FINALIZE_WRONG_STATE', 'KPI is not ready for finalization');
    const taskSummary = await this.taskSummary(assignment.userId, assignment.periodStart, assignment.periodEnd);
    const score = this.scoring.calculateWeightedScore(
      assignment.results.map((result) => ({
        weight: result.criteria.weight,
        score: result.finalScore ?? result.leaderScore ?? result.employeeScore ?? this.scoring.scoreByMethod(result.criteria.scoringMethod, result.actualValue, result.targetValue),
      })),
    );
    const payload = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.employeeKpiAssignment.updateMany({
        where: { id, status: EmployeeKpiAssignmentStatus.FINAL_REVIEW },
        data: { status: EmployeeKpiAssignmentStatus.FINALIZED, finalizedAt: new Date(), finalScore: score.score, snapshot: { score, taskSummary } },
      });
      if (changed.count !== 1) throw conflict('KPI_STATE_CONFLICT', 'KPI state already changed');
      const updated = await tx.employeeKpiAssignment.findUniqueOrThrow({ where: { id }, include: this.include() });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'KPI_FINALIZED', entityType: 'EmployeeKpiAssignment', entityId: id, metadata: { finalScore: score.score } } });
      const notification = await this.notifications.createForUsers(tx, [updated.userId], {
        type: NotificationType.KPI_FINALIZED,
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

  private async changeStatus(
    id: string,
    actor: AuthenticatedUser,
    from: EmployeeKpiAssignmentStatus,
    to: EmployeeKpiAssignmentStatus,
    auditAction: string,
    notificationType: NotificationType,
    options: { ownOnly?: boolean; departmentOnly?: boolean; submittedAt?: Date; reviewedAt?: Date },
  ) {
    const assignment = await this.prisma.employeeKpiAssignment.findUnique({ where: { id } });
    if (!assignment) throw notFound('KPI_ASSIGNMENT_NOT_FOUND', 'KPI assignment not found');
    if (options.ownOnly && assignment.userId !== actor.userId) throw forbidden('KPI_SELF_REVIEW_FORBIDDEN', 'Cannot submit another employee KPI');
    if (options.departmentOnly) {
      const departmentId = await this.scope.getPrimaryDepartmentId(assignment.userId);
      this.scope.assertDepartmentAccess(actor, departmentId);
    }
    const payload = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.employeeKpiAssignment.updateMany({ where: { id, status: from }, data: { status: to, submittedAt: options.submittedAt, reviewedAt: options.reviewedAt } });
      if (changed.count !== 1) throw conflict('KPI_STATE_CONFLICT', 'KPI state already changed');
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

  private async assertCanRead(userId: string, actor: AuthenticatedUser) {
    if (userId === actor.userId && this.has(actor, 'kpi.read_own')) return;
    if (this.has(actor, 'kpi.read_all')) return;
    if (this.has(actor, 'kpi.read_department')) {
      const departmentId = await this.scope.getPrimaryDepartmentId(userId);
      this.scope.assertDepartmentAccess(actor, departmentId);
      return;
    }
    throw forbidden('KPI_IDOR_DENIED', 'Cannot read this KPI assignment');
  }

  private async taskSummary(userId: string, periodStart: Date, periodEnd: Date) {
    const assignments = await this.prisma.taskAssignment.findMany({
      where: { userId, createdAt: { gte: periodStart, lte: periodEnd } },
      select: { status: true, assignmentDueAt: true, completedAt: true },
    });
    const completed = assignments.filter((item) => item.status === TaskAssignmentStatus.COMPLETED).length;
    const rejected = assignments.filter((item) => item.status === TaskAssignmentStatus.REJECTED).length;
    const overdue = assignments.filter((item) => item.assignmentDueAt && (!item.completedAt || item.completedAt > item.assignmentDueAt)).length;
    return { total: assignments.length, completed, rejected, overdue, completionRate: assignments.length ? completed / assignments.length : 0 };
  }

  private include() {
    return { kpiTemplate: { include: { criteria: true } }, results: { include: { criteria: true } }, user: { include: { profile: true } } } as const;
  }

  private has(actor: AuthenticatedUser, permission: string) {
    return actor.permissions.includes(permission);
  }
}
