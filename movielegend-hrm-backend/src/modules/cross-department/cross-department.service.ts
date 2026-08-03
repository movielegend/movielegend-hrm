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
    if (dto.sourceDepartmentId === dto.targetDepartmentId) {
      throw badRequest('SAME_DEPARTMENT', 'Phòng ban nguồn và phòng ban đích không được trùng nhau');
    }

    const isPowerUser = actor.roles.includes('ADMIN') || actor.roles.includes('HR');
    if (!isPowerUser) {
      await this.scope.assertUserInDepartment(actor.userId, dto.sourceDepartmentId);
    }

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
          status: isPowerUser ? CrossDepartmentRequestStatus.SOURCE_APPROVED : CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL,
          decidedByUserId: isPowerUser ? actor.userId : null,
          decidedAt: isPowerUser ? new Date() : null,
        },
      });
      const targetLeaders = await tx.department.findUnique({
        where: { id: dto.targetDepartmentId },
        select: { leaderUserId: true },
      });
      const sourceLeaders = await tx.department.findUnique({
        where: { id: dto.sourceDepartmentId },
        select: { leaderUserId: true },
      });
      
      const notificationTarget = isPowerUser ? targetLeaders?.leaderUserId : sourceLeaders?.leaderUserId;
      
      const notification = await this.notifications.createForUsers(tx, notificationTarget ? [notificationTarget] : [], {
        type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
        title: isPowerUser ? 'New cross-department request assigned' : 'Cross-department request pending',
        body: dto.title,
        taskId: dto.taskId,
      });
      return { request, notification };
    });
    this.notifications.emitCreated(payload.notification);
    return payload.request;
  }

  findAll(actor: AuthenticatedUser, type?: 'incoming' | 'outgoing') {
    const includeClause = {
      createdBy: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
      assignedTo: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
      sourceDepartment: { select: { id: true, code: true, name: true } },
      targetDepartment: { select: { id: true, code: true, name: true } },
    };

    if (actor.roles.includes('ADMIN')) {
      if (type === 'incoming') {
        return this.prisma.crossDepartmentRequest.findMany({ 
          where: { status: { in: ['SOURCE_APPROVED', 'TARGET_ACCEPTED', 'TARGET_ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW'] } }, 
          include: includeClause,
          orderBy: { createdAt: 'desc' } 
        });
      }
      return this.prisma.crossDepartmentRequest.findMany({ include: includeClause, orderBy: { createdAt: 'desc' } });
    }

    const visible = this.scope.visibleDepartmentIds(actor) ?? [];
    let whereClause: any = { 
      OR: [
        { sourceDepartmentId: { in: visible } }, 
        { targetDepartmentId: { in: visible } }, 
        { createdByUserId: actor.userId },
        { assignedToUserId: actor.userId }
      ] 
    };
    
    if (type === 'incoming') {
      whereClause = { 
        OR: [
          { targetDepartmentId: { in: visible } },
          { assignedToUserId: actor.userId }
        ]
      };
    } else if (type === 'outgoing') {
      whereClause = { 
        OR: [
          { sourceDepartmentId: { in: visible } }, 
          { createdByUserId: actor.userId }
        ]
      };
    }

    return this.prisma.crossDepartmentRequest.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        assignedTo: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
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

  async assignTarget(id: string, dto: import('./dto/cross-department.dto').AssignTargetDto, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    this.scope.assertDepartmentAccess(actor, request.targetDepartmentId);
    if (request.status !== CrossDepartmentRequestStatus.TARGET_ACCEPTED && request.status !== CrossDepartmentRequestStatus.SOURCE_APPROVED) {
      throw badRequest('INVALID_CROSS_DEPARTMENT_STATUS', `Request cannot be assigned in status ${request.status}`);
    }
    return this.prisma.crossDepartmentRequest.update({
      where: { id },
      data: {
        status: CrossDepartmentRequestStatus.TARGET_ASSIGNED,
        assignedToUserId: dto.assignedToUserId,
      },
    });
  }

  async updateProgress(id: string, dto: import('./dto/cross-department.dto').UpdateProgressDto, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    if (request.assignedToUserId !== actor.userId && !actor.roles.includes('ADMIN')) {
      throw forbidden('CROSS_DEPARTMENT_REQUEST_FORBIDDEN', 'Only the assignee can update progress');
    }
    return this.prisma.crossDepartmentRequest.update({
      where: { id },
      data: {
        progress: dto.progress,
        status: dto.progress > 0 ? CrossDepartmentRequestStatus.IN_PROGRESS : request.status,
      },
    });
  }

  async submitDeliverable(id: string, dto: import('./dto/cross-department.dto').SubmitDeliverableDto, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    if (request.assignedToUserId !== actor.userId && !actor.roles.includes('ADMIN')) {
      throw forbidden('CROSS_DEPARTMENT_REQUEST_FORBIDDEN', 'Only the assignee can submit deliverables');
    }
    return this.prisma.crossDepartmentRequest.update({
      where: { id },
      data: {
        status: CrossDepartmentRequestStatus.SUBMITTED_FOR_REVIEW,
        resultSummary: dto.resultSummary,
        progress: 100,
      },
    });
  }

  async completeTask(id: string, dto: import('./dto/cross-department.dto').CompleteTaskDto, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    this.scope.assertDepartmentAccess(actor, request.sourceDepartmentId);
    if (request.status !== CrossDepartmentRequestStatus.SUBMITTED_FOR_REVIEW) {
      throw badRequest('INVALID_CROSS_DEPARTMENT_STATUS', `Request must be SUBMITTED_FOR_REVIEW`);
    }
    return this.prisma.crossDepartmentRequest.update({
      where: { id },
      data: {
        status: CrossDepartmentRequestStatus.COMPLETED,
        rating: dto.rating,
      },
    });
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
    request: { createdByUserId: string; assignedToUserId?: string | null; sourceDepartmentId: string; targetDepartmentId: string },
    actor: AuthenticatedUser,
  ): boolean {
    if (actor.roles.includes('ADMIN') || actor.permissions.includes('cross_department.read_all')) return true;
    if (request.createdByUserId === actor.userId || request.assignedToUserId === actor.userId) return true;
    const visible = this.scope.visibleDepartmentIds(actor) ?? [];
    return visible.includes(request.sourceDepartmentId) || visible.includes(request.targetDepartmentId);
  }
}
