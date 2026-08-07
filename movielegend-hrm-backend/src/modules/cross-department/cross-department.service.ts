import { Injectable } from '@nestjs/common';
import { CrossDepartmentRequestStatus, NotificationType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateCrossDepartmentRequestDto, RejectCrossDepartmentRequestDto } from './dto/cross-department.dto';

@Injectable()
export class CrossDepartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
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
      const targetDept = await tx.department.findUnique({
        where: { id: dto.targetDepartmentId },
        select: { leaderUserId: true },
      });
      const sourceDept = await tx.department.findUnique({
        where: { id: dto.sourceDepartmentId },
        select: { leaderUserId: true },
      });

      const isSourceLeader = sourceDept?.leaderUserId === actor.userId;
      const isAutoSourceApproved = isPowerUser || isSourceLeader;

      const request = await tx.crossDepartmentRequest.create({
        data: {
          requestCode,
          taskId: dto.taskId,
          createdByUserId: actor.userId,
          sourceDepartmentId: dto.sourceDepartmentId,
          targetDepartmentId: dto.targetDepartmentId,
          title: dto.title,
          content: dto.content,
          status: isAutoSourceApproved ? CrossDepartmentRequestStatus.SOURCE_APPROVED : CrossDepartmentRequestStatus.PENDING_SOURCE_APPROVAL,
          decidedByUserId: isAutoSourceApproved ? actor.userId : null,
          decidedAt: isAutoSourceApproved ? new Date() : null,
        },
      });
      
      const notifyUsers = new Set<string>();
      if (isPowerUser || sourceDept?.leaderUserId === actor.userId) {
        // Leader phòng nguồn tạo hoặc Admin tạo -> Gửi trực tiếp cho Leader phòng nhận
        if (targetDept?.leaderUserId && targetDept.leaderUserId !== actor.userId) {
          notifyUsers.add(targetDept.leaderUserId);
        }
      } else {
        // Nhân viên phòng nguồn tạo -> Gửi cho Leader phòng nguồn duyệt trước
        if (sourceDept?.leaderUserId && sourceDept.leaderUserId !== actor.userId) {
          notifyUsers.add(sourceDept.leaderUserId);
        }
      }

      const notificationTargetArray = Array.from(notifyUsers);
      
      const notification = await this.notifications.createForUsers(tx, notificationTargetArray, {
        type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
        title: isPowerUser ? 'Yêu cầu luân chuyển / phối hợp mới' : 'Yêu cầu luân chuyển cần duyệt',
        body: dto.title,
        taskId: dto.taskId || undefined,
        metadata: { requestId: request.id },
      });
      return { request, notification, notifyUsers: notificationTargetArray };
    });
    if (payload.notification) {
      this.notifications.emitCreated(payload.notification);
    }
    for (const uid of payload.notifyUsers) {
      this.realtime.emitToUser(uid, 'cross-department:updated', { id: payload.request.id, action: 'created' });
    }
    return payload.request;
  }

  async findAll(actor: AuthenticatedUser, type?: 'incoming' | 'outgoing') {
    const includeClause = {
      createdBy: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
      assignedTo: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
      sourceDepartment: { select: { id: true, code: true, name: true } },
      targetDepartment: { select: { id: true, code: true, name: true } },
    };

    const isPowerUser = actor.roles.includes('ADMIN') || actor.roles.includes('HR');

    if (isPowerUser) {
      if (type === 'incoming') {
        // Yêu cầu đến: Phòng ban đính kèm hoặc phòng nhận trùng với phòng của user, HOẶC đơn gửi TỚI phòng ban mà người dùng đang xem
        return this.prisma.crossDepartmentRequest.findMany({ 
          where: { 
            OR: [
              { targetDepartment: { leaderUserId: actor.userId } },
              { assignedToUserId: actor.userId },
              { targetDepartmentId: { in: await this.getUserDepartmentIds(actor.userId) } }
            ]
          }, 
          include: includeClause,
          orderBy: { createdAt: 'desc' } 
        });
      }
      if (type === 'outgoing') {
        // Yêu cầu đã gửi: Do chính user tạo HOẶC do phòng ban của user gửi đi
        return this.prisma.crossDepartmentRequest.findMany({ 
          where: { 
            OR: [
              { createdByUserId: actor.userId },
              { sourceDepartmentId: { in: await this.getUserDepartmentIds(actor.userId) } }
            ]
          }, 
          include: includeClause,
          orderBy: { createdAt: 'desc' } 
        });
      }
      return this.prisma.crossDepartmentRequest.findMany({ include: includeClause, orderBy: { createdAt: 'desc' } });
    }

    const isLeader = actor.roles.includes('LEADER') || actor.scopes.some(s => s.role === 'LEADER');

    if (isLeader) {
      const visibleFromScopes = this.scope.visibleDepartmentIds(actor) ?? [];
      const memberDeptIds = await this.getUserDepartmentIds(actor.userId);
      const visible = Array.from(new Set([...visibleFromScopes, ...memberDeptIds]));

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

    // Nhân viên thông thường: Chỉ thấy đơn do CHÍNH MÌNH TẠO (Yêu cầu đã gửi) hoặc ĐƯỢC PHÂN CÔNG (Yêu cầu đến)
    let employeeWhereClause: any = {
      OR: [
        { createdByUserId: actor.userId },
        { assignedToUserId: actor.userId }
      ]
    };

    if (type === 'incoming') {
      employeeWhereClause = { assignedToUserId: actor.userId };
    } else if (type === 'outgoing') {
      employeeWhereClause = { createdByUserId: actor.userId };
    }

    return this.prisma.crossDepartmentRequest.findMany({
      where: employeeWhereClause,
      include: includeClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getUserDepartmentIds(userId: string): Promise<string[]> {
    const deptMembers = await this.prisma.departmentMember.findMany({
      where: { userId, leftAt: null },
      select: { departmentId: true },
    });
    return deptMembers.map((m) => m.departmentId);
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
    if (!actor.roles.includes('ADMIN') && !actor.roles.includes('HR')) {
      this.scope.assertDepartmentAccess(actor, request.targetDepartmentId);
    }
    if (request.status !== CrossDepartmentRequestStatus.TARGET_ACCEPTED && request.status !== CrossDepartmentRequestStatus.SOURCE_APPROVED) {
      throw badRequest('INVALID_CROSS_DEPARTMENT_STATUS', `Request cannot be assigned in status ${request.status}`);
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.crossDepartmentRequest.update({
        where: { id },
        data: {
          status: CrossDepartmentRequestStatus.TARGET_ASSIGNED,
          assignedToUserId: dto.assignedToUserId,
        },
      });

      const notification = await this.notifications.createForUsers(tx, [dto.assignedToUserId], {
        type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
        title: 'Nhiệm vụ phối hợp liên phòng ban mới',
        body: `Bạn được phân công thực hiện yêu cầu luân chuyển / phối hợp "${request.title}"`,
        taskId: request.taskId || undefined,
        metadata: { requestId: request.id },
      });

      return { updated, notification };
    });

    if (payload.notification) {
      this.notifications.emitCreated(payload.notification);
    }
    this.realtime.emitToUser(dto.assignedToUserId, 'cross-department:updated', { id, action: 'assigned' });
    if (request.createdByUserId !== dto.assignedToUserId) {
      this.realtime.emitToUser(request.createdByUserId, 'cross-department:updated', { id, action: 'assigned' });
    }

    return payload.updated;
  }

  async updateProgress(id: string, dto: import('./dto/cross-department.dto').UpdateProgressDto, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    if (request.assignedToUserId !== actor.userId && !actor.roles.includes('ADMIN') && !actor.roles.includes('HR')) {
      throw forbidden('CROSS_DEPARTMENT_REQUEST_FORBIDDEN', 'Only the assignee can update progress');
    }
    const updated = await this.prisma.crossDepartmentRequest.update({
      where: { id },
      data: {
        progress: dto.progress,
        status: dto.progress > 0 ? CrossDepartmentRequestStatus.IN_PROGRESS : request.status,
      },
    });
    this.realtime.emitToUser(request.createdByUserId, 'cross-department:updated', { id, action: 'progress' });
    return updated;
  }

  async submitDeliverable(id: string, dto: import('./dto/cross-department.dto').SubmitDeliverableDto, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ 
      where: { id },
      include: { sourceDepartment: { select: { leaderUserId: true } } }
    });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    if (request.assignedToUserId !== actor.userId && !actor.roles.includes('ADMIN') && !actor.roles.includes('HR')) {
      throw forbidden('CROSS_DEPARTMENT_REQUEST_FORBIDDEN', 'Only the assignee can submit deliverables');
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.crossDepartmentRequest.update({
        where: { id },
        data: {
          status: CrossDepartmentRequestStatus.SUBMITTED_FOR_REVIEW,
          resultSummary: dto.resultSummary,
          progress: 100,
        },
      });

      const notifyUsers = new Set<string>([request.createdByUserId]);
      if (request.sourceDepartment?.leaderUserId) notifyUsers.add(request.sourceDepartment.leaderUserId);

      const notification = await this.notifications.createForUsers(tx, Array.from(notifyUsers), {
        type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
        title: 'Nộp báo cáo luân chuyển / phối hợp',
        body: `Công việc "${request.title}" đã được nộp báo cáo kết quả. Vui lòng nghiệm thu!`,
        taskId: request.taskId || undefined,
        metadata: { requestId: request.id },
      });

      return { updated, notification, notifyUsers: Array.from(notifyUsers) };
    });

    if (payload.notification) {
      this.notifications.emitCreated(payload.notification);
    }
    for (const uid of payload.notifyUsers) {
      this.realtime.emitToUser(uid, 'cross-department:updated', { id, action: 'submitted' });
    }

    return payload.updated;
  }

  async completeTask(id: string, dto: import('./dto/cross-department.dto').CompleteTaskDto, actor: AuthenticatedUser) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    if (!actor.roles.includes('ADMIN') && !actor.roles.includes('HR')) {
      this.scope.assertDepartmentAccess(actor, request.sourceDepartmentId);
    }
    if (request.status !== CrossDepartmentRequestStatus.SUBMITTED_FOR_REVIEW) {
      throw badRequest('INVALID_CROSS_DEPARTMENT_STATUS', `Request must be SUBMITTED_FOR_REVIEW`);
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.crossDepartmentRequest.update({
        where: { id },
        data: {
          status: CrossDepartmentRequestStatus.COMPLETED,
          rating: dto.rating,
        },
      });

      const notifyUsers = new Set<string>();
      if (request.assignedToUserId) notifyUsers.add(request.assignedToUserId);

      const notification = await this.notifications.createForUsers(tx, Array.from(notifyUsers), {
        type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
        title: 'Yêu cầu luân chuyển đã nghiệm thu',
        body: `Yêu cầu "${request.title}" đã được nghiệm thu và đánh giá ${dto.rating ?? 5} sao!`,
        taskId: request.taskId || undefined,
        metadata: { requestId: request.id },
      });

      return { updated, notification, notifyUsers: Array.from(notifyUsers) };
    });

    if (payload.notification) {
      this.notifications.emitCreated(payload.notification);
    }
    if (request.assignedToUserId) {
      this.realtime.emitToUser(request.assignedToUserId, 'cross-department:updated', { id, action: 'completed' });
    }

    return payload.updated;
  }

  private async decide(
    id: string,
    actor: AuthenticatedUser,
    expected: CrossDepartmentRequestStatus,
    next: CrossDepartmentRequestStatus,
    side: 'source' | 'target',
    rejectionReason?: string,
  ) {
    const request = await this.prisma.crossDepartmentRequest.findUnique({ 
      where: { id },
      include: { 
        targetDepartment: { select: { leaderUserId: true } },
        sourceDepartment: { select: { leaderUserId: true } }
      }
    });
    if (!request) throw notFound('CROSS_DEPARTMENT_REQUEST_NOT_FOUND', 'Cross-department request not found');
    if (!actor.roles.includes('ADMIN') && !actor.roles.includes('HR')) {
      this.scope.assertDepartmentAccess(actor, side === 'source' ? request.sourceDepartmentId : request.targetDepartmentId);
    }
    if (request.status !== expected) throw badRequest('INVALID_CROSS_DEPARTMENT_STATUS', `Request must be ${expected}`);

    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.crossDepartmentRequest.update({
        where: { id },
        data: {
          status: next,
          rejectionReason,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
      });

      let notification = null;
      const notifyUsers = new Set<string>();

      // If source leader approves, notify target department leader
      if (side === 'source' && next === CrossDepartmentRequestStatus.SOURCE_APPROVED) {
        const targetLeaderId = request.targetDepartment?.leaderUserId;
        if (targetLeaderId) {
          notifyUsers.add(targetLeaderId);
          notification = await this.notifications.createForUsers(tx, [targetLeaderId], {
            type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
            title: 'Yêu cầu luân chuyển / phối hợp đến',
            body: `Có yêu cầu luân chuyển mới "${request.title}" cần xử lý`,
            taskId: request.taskId || undefined,
            metadata: { requestId: request.id },
          });
        }
      } else if (next.includes('REJECTED')) {
        notifyUsers.add(request.createdByUserId);
        notification = await this.notifications.createForUsers(tx, [request.createdByUserId], {
          type: NotificationType.CROSS_DEPARTMENT_REQUESTED,
          title: 'Yêu cầu luân chuyển bị từ chối',
          body: `Yêu cầu "${request.title}" đã bị từ chối.${rejectionReason ? ` Lý do: ${rejectionReason}` : ''}`,
          taskId: request.taskId || undefined,
          metadata: { requestId: request.id },
        });
      }

      return { updated, notification, notifyUsers: Array.from(notifyUsers) };
    });

    if (payload.notification) {
      this.notifications.emitCreated(payload.notification);
    }

    this.realtime.emitToUser(request.createdByUserId, 'cross-department:updated', { id, status: next });
    for (const uid of payload.notifyUsers) {
      this.realtime.emitToUser(uid, 'cross-department:updated', { id, status: next });
    }

    return payload.updated;
  }

  private canView(
    request: { createdByUserId: string; assignedToUserId?: string | null; sourceDepartmentId: string; targetDepartmentId: string },
    actor: AuthenticatedUser,
  ): boolean {
    if (actor.roles.includes('ADMIN') || actor.roles.includes('HR') || actor.permissions.includes('cross_department.read_all')) return true;
    if (request.createdByUserId === actor.userId || request.assignedToUserId === actor.userId) return true;
    const visible = this.scope.visibleDepartmentIds(actor) ?? [];
    return visible.includes(request.sourceDepartmentId) || visible.includes(request.targetDepartmentId);
  }
}
