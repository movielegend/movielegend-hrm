import { Injectable } from '@nestjs/common';
import { CrossDepartmentRequestStatus, NotificationType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { CreateCrossDepartmentRequestDto, RejectCrossDepartmentRequestDto } from './dto/cross-department.dto';

@Injectable()
export class CrossDepartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateCrossDepartmentRequestDto, actor: AuthenticatedUser) {
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
        type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
        title: 'Cross-department request pending',
        body: dto.title,
        taskId: dto.taskId,
      });
      return { request, notification };
    });
    this.notifications.emitCreated(payload.notification);
    return payload.request;
  }

  findAll(actor: AuthenticatedUser) {
    if (actor.roles.includes('ADMIN')) {
      return this.prisma.crossDepartmentRequest.findMany({ orderBy: { createdAt: 'desc' } });
    }
    const visible = this.scope.visibleDepartmentIds(actor) ?? [];
    return this.prisma.crossDepartmentRequest.findMany({
      where: { OR: [{ sourceDepartmentId: { in: visible } }, { targetDepartmentId: { in: visible } }, { createdByUserId: actor.userId }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
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
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    if (!this.canView(request, actor)) {
      throw forbidden('CROSS_DEPARTMENT_REQUEST_FORBIDDEN', 'Cannot access cross-department request');
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
          status: CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL,
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

  approveSource(id: string, actor: AuthenticatedUser) {
    return this.decide(id, actor, CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL, CrossDepartmentRequestStatus.SOURCE_APPROVED, 'source');
  }

  rejectSource(id: string, dto: RejectCrossDepartmentRequestDto, actor: AuthenticatedUser) {
    return this.decide(id, actor, CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL, CrossDepartmentRequestStatus.SOURCE_REJECTED, 'source', dto.reason);
  }

  acceptTarget(id: string, actor: AuthenticatedUser) {
    return this.decide(id, actor, CrossDepartmentRequestStatus.SOURCE_APPROVED, CrossDepartmentRequestStatus.TARGET_ACCEPTED, 'target');
  }

  rejectTarget(id: string, dto: RejectCrossDepartmentRequestDto, actor: AuthenticatedUser) {
    return this.decide(id, actor, CrossDepartmentRequestStatus.SOURCE_APPROVED, CrossDepartmentRequestStatus.TARGET_REJECTED, 'target', dto.reason);
  }

  private async decide(
    id: string,
    actor: AuthenticatedUser,
    expected: CrossDepartmentRequestStatus,
    next: CrossDepartmentRequestStatus,
    side: 'source' | 'target',
    rejectionReason?: string,
  ) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    this.scope.assertDepartmentAccess(actor, side === 'source' ? request.sourceDepartmentId : request.targetDepartmentId);
    if (request.status !== expected) throw badRequest('INVALID_CROSS_DEPARTMENT_STATUS', `Request must be ${expected}`);
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

  private canView(
    request: { createdByUserId: string; sourceDepartmentId: string; targetDepartmentId: string },
    actor: AuthenticatedUser,
  ): boolean {
    if (actor.roles.includes('ADMIN') || actor.permissions.includes('cross_department.read_all')) return true;
    if (request.createdByUserId === actor.userId) return true;
    const visible = this.scope.visibleDepartmentIds(actor) ?? [];
    return visible.includes(request.sourceDepartmentId) || visible.includes(request.targetDepartmentId);
  }
}
