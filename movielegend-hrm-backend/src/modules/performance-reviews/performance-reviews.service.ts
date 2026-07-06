import { Injectable } from '@nestjs/common';
import { NotificationType, PerformanceReviewCycleStatus, PerformanceReviewStatus, ReviewerType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { AssignReviewerDto, CreateReviewCycleDto, SubmitReviewDto } from './dto/performance-review.dto';

@Injectable()
export class PerformanceReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  async createCycle(dto: CreateReviewCycleDto, actor: AuthenticatedUser) {
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

  async findCycle(id: string) {
    const cycle = await this.prisma.performanceReviewCycle.findUnique({ where: { id }, include: { reviews: true, reviewerAssignments: true } });
    if (!cycle) throw notFound('REVIEW_CYCLE_NOT_FOUND', 'Review cycle not found');
    return cycle;
  }

  openCycle(id: string, actor: AuthenticatedUser) {
    return this.advanceCycle(id, actor, PerformanceReviewCycleStatus.DRAFT, PerformanceReviewCycleStatus.OPEN);
  }

  async advanceStage(id: string, actor: AuthenticatedUser) {
    const cycle = await this.prisma.performanceReviewCycle.findUnique({ where: { id } });
    if (!cycle) throw notFound('REVIEW_CYCLE_NOT_FOUND', 'Review cycle not found');
    const next: Record<PerformanceReviewCycleStatus, PerformanceReviewCycleStatus | null> = {
      DRAFT: PerformanceReviewCycleStatus.OPEN,
      OPEN: PerformanceReviewCycleStatus.SELF_REVIEW,
      SELF_REVIEW: PerformanceReviewCycleStatus.LEADER_REVIEW,
      LEADER_REVIEW: PerformanceReviewCycleStatus.FINAL_REVIEW,
      FINAL_REVIEW: PerformanceReviewCycleStatus.CLOSED,
      CLOSED: null,
      CANCELLED: null,
    };
    const to = next[cycle.status];
    if (!to) throw badRequest('REVIEW_CYCLE_FINAL_STATE', 'Review cycle cannot advance');
    return this.advanceCycle(id, actor, cycle.status, to);
  }

  closeCycle(id: string, actor: AuthenticatedUser) {
    return this.advanceCycle(id, actor, PerformanceReviewCycleStatus.FINAL_REVIEW, PerformanceReviewCycleStatus.CLOSED);
  }

  async assignReviewer(cycleId: string, dto: AssignReviewerDto) {
    const cycle = await this.findCycle(cycleId);
    if (cycle.status === PerformanceReviewCycleStatus.CLOSED) throw badRequest('REVIEW_CYCLE_CLOSED', 'Review cycle is closed');
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

  findMine(actor: AuthenticatedUser) {
    return this.prisma.performanceReview.findMany({ where: { userId: actor.userId }, include: this.include(), orderBy: { createdAt: 'desc' } });
  }

  async findDepartment(departmentId: string, actor: AuthenticatedUser) {
    this.scope.assertDepartmentAccess(actor, departmentId);
    const members = await this.prisma.departmentMember.findMany({ where: { departmentId, leftAt: null }, select: { userId: true } });
    return this.prisma.performanceReview.findMany({ where: { userId: { in: members.map((member) => member.userId) } }, include: this.include(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id }, include: this.include() });
    if (!review) throw notFound('PERFORMANCE_REVIEW_NOT_FOUND', 'Performance review not found');
    await this.assertCanRead(review.userId, actor);
    return review;
  }

  async selfSubmit(id: string, dto: SubmitReviewDto, actor: AuthenticatedUser) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id } });
    if (!review) throw notFound('PERFORMANCE_REVIEW_NOT_FOUND', 'Performance review not found');
    if (review.userId !== actor.userId) throw forbidden('PERFORMANCE_REVIEW_SELF_FORBIDDEN', 'Cannot self-submit another employee review');
    return this.updateReviewStatus(id, actor, PerformanceReviewStatus.PENDING, PerformanceReviewStatus.LEADER_REVIEW, {
      selfSummary: dto.summary,
      selfScore: dto.score,
      submittedAt: new Date(),
    });
  }

  async leaderSubmit(id: string, dto: SubmitReviewDto, actor: AuthenticatedUser) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id } });
    if (!review) throw notFound('PERFORMANCE_REVIEW_NOT_FOUND', 'Performance review not found');
    const assignment = await this.prisma.reviewerAssignment.findFirst({
      where: { reviewCycleId: review.cycleId, employeeUserId: review.userId, reviewerUserId: actor.userId, reviewerType: { in: [ReviewerType.DIRECT_LEADER, ReviewerType.SECOND_LEVEL] } },
    });
    if (!assignment) throw forbidden('PERFORMANCE_REVIEW_REVIEWER_DENIED', 'Reviewer is not assigned to this employee');
    const departmentId = await this.scope.getPrimaryDepartmentId(review.userId);
    this.scope.assertDepartmentAccess(actor, departmentId);
    return this.updateReviewStatus(id, actor, PerformanceReviewStatus.LEADER_REVIEW, PerformanceReviewStatus.FINAL_REVIEW, {
      leaderSummary: dto.summary,
      leaderScore: dto.score,
      reviewedAt: new Date(),
      reviewerUserId: actor.userId,
    });
  }

  finalize(id: string, dto: SubmitReviewDto, actor: AuthenticatedUser) {
    return this.updateReviewStatus(id, actor, PerformanceReviewStatus.FINAL_REVIEW, PerformanceReviewStatus.FINALIZED, {
      finalSummary: dto.summary,
      finalScore: dto.score,
      finalizedAt: new Date(),
    });
  }

  private async advanceCycle(id: string, actor: AuthenticatedUser, from: PerformanceReviewCycleStatus, to: PerformanceReviewCycleStatus) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.performanceReviewCycle.updateMany({ where: { id, status: from }, data: { status: to } });
      if (changed.count !== 1) throw conflict('REVIEW_CYCLE_STATE_CONFLICT', 'Review cycle state already changed');
      const cycle = await tx.performanceReviewCycle.findUniqueOrThrow({ where: { id }, include: { reviews: true } });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'PERFORMANCE_REVIEW_STAGE_CHANGED', entityType: 'PerformanceReviewCycle', entityId: id, metadata: { from, to } } });
      const userIds = cycle.reviews.map((review) => review.userId);
      const notification = await this.notifications.createForUsers(tx, userIds, {
        type: to === PerformanceReviewCycleStatus.OPEN ? NotificationType.PERFORMANCE_REVIEW_OPENED : NotificationType.PERFORMANCE_REVIEW_STAGE_CHANGED,
        title: 'Performance review updated',
        body: cycle.name,
        metadata: { cycleId: id, status: to },
      });
      return { cycle, notification };
    });
    this.notifications.emitCreated(payload.notification);
    for (const review of payload.cycle.reviews) this.realtime.emitToUser(review.userId, 'performance-review:updated', { cycleId: id, status: to });
    return payload.cycle;
  }

  private async updateReviewStatus(id: string, actor: AuthenticatedUser, from: PerformanceReviewStatus, to: PerformanceReviewStatus, data: Record<string, unknown>) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.performanceReview.updateMany({ where: { id, status: from }, data: { status: to, ...data } });
      if (changed.count !== 1) throw conflict('PERFORMANCE_REVIEW_STATE_CONFLICT', 'Performance review state already changed');
      const review = await tx.performanceReview.findUniqueOrThrow({ where: { id }, include: this.include() });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: to === PerformanceReviewStatus.FINALIZED ? 'PERFORMANCE_REVIEW_FINALIZED' : 'PERFORMANCE_REVIEW_UPDATED',
          entityType: 'PerformanceReview',
          entityId: id,
          metadata: { from, to },
        },
      });
      const notification = await this.notifications.createForUsers(tx, [review.userId], {
        type: to === PerformanceReviewStatus.FINALIZED ? NotificationType.PERFORMANCE_REVIEW_FINALIZED : NotificationType.PERFORMANCE_REVIEW_STAGE_CHANGED,
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

  private async assertCanRead(userId: string, actor: AuthenticatedUser) {
    if (userId === actor.userId && this.has(actor, 'performance_review.read_own')) return;
    if (this.has(actor, 'performance_review.read_all')) return;
    if (this.has(actor, 'performance_review.read_department')) {
      const departmentId = await this.scope.getPrimaryDepartmentId(userId);
      this.scope.assertDepartmentAccess(actor, departmentId);
      return;
    }
    throw forbidden('PERFORMANCE_REVIEW_IDOR_DENIED', 'Cannot read this performance review');
  }

  private assertDates(dto: CreateReviewCycleDto) {
    const pairs = [
      [dto.periodStart, dto.periodEnd],
      [dto.selfReviewStart, dto.selfReviewEnd],
      [dto.leaderReviewStart, dto.leaderReviewEnd],
      [dto.finalReviewStart, dto.finalReviewEnd],
    ];
    if (pairs.some(([start, end]) => new Date(end) < new Date(start))) throw badRequest('REVIEW_CYCLE_DATES_INVALID', 'Review cycle dates are invalid');
  }

  private include() {
    return { cycle: true, user: { include: { profile: true } }, reviewer: true } as const;
  }

  private has(actor: AuthenticatedUser, permission: string) {
    return actor.permissions.includes(permission);
  }
}
