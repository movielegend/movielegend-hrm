import { Injectable } from '@nestjs/common';
import {
  AccountStatus,
  NotificationType,
  Prisma,
  TaskAssignmentStatus,
  TaskHistoryAction,
  TaskStatus,
  TaskTargetType,
  TaskType,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import {
  CreateTaskAttachmentDto,
  CreateTaskCommentDto,
  CreateTaskDto,
  CreateTaskExtensionRequestDto,
  ReviewTaskDto,
  SubmitTaskDto,
  TaskExtensionPendingQueryDto,
  TaskQueryDto,
  TaskReviewQueueQueryDto,
  TaskTimelineQueryDto,
  UpdateProgressDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TaskPolicyService } from './task-policy.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly policy: TaskPolicyService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateTaskDto, actor: AuthenticatedUser) {
    this.assertCanCreate(dto, actor);
    if (dto.departmentContextId) this.scope.assertDepartmentAccess(actor, dto.departmentContextId);
    const assigneeIds = await this.resolveAssignees(dto, actor);
    if (!dto.isAdhocGroup && !assigneeIds.length) throw badRequest('TASK_TARGET_EMPTY', 'Task must have at least one assignee');
    const payload = await this.prisma.$transaction(async (tx) => {
      const taskCode = await this.prisma.nextTaskCode(tx);
      const task = await tx.task.create({
        data: {
          taskCode,
          title: dto.title,
          description: dto.description,
          type: dto.type ?? this.inferTaskType(dto),
          priority: dto.priority,
          departmentContextId: dto.departmentContextId,
          parentTaskId: dto.parentTaskId,
          startAt: dto.startAt ? new Date(dto.startAt) : undefined,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
          createdByUserId: actor.userId,
          groupLeaderId: dto.isAdhocGroup ? dto.leaderId : undefined,
          targets: dto.targets?.length ? {
            create: dto.targets.map((target) => ({
              targetType: target.targetType,
              targetId: target.targetId,
            })),
          } : undefined,
          assignments: {
            create: assigneeIds.map((userId) => ({
              userId,
              assignedByUserId: actor.userId,
              assignmentDueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
            })),
          },
          histories: {
            create: {
              actorUserId: actor.userId,
              action: TaskHistoryAction.CREATED,
              toStatus: TaskStatus.NEW,
              metadata: { assigneeIds },
            },
          },
        },
        include: this.taskDetailInclude(),
      });

      if (dto.isAdhocGroup && dto.memberIds?.length) {
        // Create chat group for ad-hoc members
        const chatMemberSet = new Set([...dto.memberIds, actor.userId]);
        if (dto.leaderId) chatMemberSet.add(dto.leaderId);
        await tx.chatGroup.create({
          data: {
            taskId: task.id,
            name: `Nhóm: ${task.title}`,
            type: 'TASK',
            members: {
              create: Array.from(chatMemberSet).map(userId => ({ userId }))
            }
          }
        });
      }
      const notification = await this.notifications.createForUsers(tx, assigneeIds, {
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        body: task.title,
        taskId: task.id,
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'task.create',
          entityType: 'Task',
          entityId: task.id,
          metadata: { taskCode, assigneeIds },
        },
      });
      return { task, notification };
    });
    this.notifications.emitCreated(payload.notification);
    return payload.task;
  }

  async findAll(actor: AuthenticatedUser, query: TaskQueryDto) {
    const where = await this.taskWhereForActor(actor, query, false);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: this.taskListInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
    ]);
    return this.paginate(items, total, query.page, query.limit);
  }

  async findMine(actor: AuthenticatedUser, query: TaskQueryDto) {
    const where = await this.taskWhereForActor(actor, query, true);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: this.taskListInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
    ]);
    return this.paginate(items, total, query.page, query.limit);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({ where: { id }, include: this.taskDetailInclude() });
    if (!task || task.deletedAt) throw notFound('TASK_NOT_FOUND', 'Task not found');
    await this.assertCanViewTask(id, actor);
    return this.enrichTaskDetail(task);
  }

  async reviewQueue(actor: AuthenticatedUser, query: TaskReviewQueueQueryDto) {
    const where = await this.assignmentScopeWhere(actor, query.departmentId);
    where.status = TaskAssignmentStatus.WAITING_REVIEW;
    const taskWhere: Prisma.TaskWhereInput = {
      ...(where.task && typeof where.task === 'object' ? where.task : {}),
      deletedAt: null,
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.fromDate || query.toDate ? { dueAt: this.dateRange(query.fromDate, query.toDate) } : {}),
    };
    where.task = taskWhere;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.taskAssignment.findMany({
        where,
        include: {
          user: { select: this.safeUserSelect() },
          task: { select: { id: true, taskCode: true, title: true, priority: true, dueAt: true, departmentContextId: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.taskAssignment.count({ where }),
    ]);
    return this.paginate(
      items.map((item) => ({
        assignmentId: item.id,
        taskId: item.taskId,
        taskCode: item.task.taskCode,
        taskTitle: item.task.title,
        employee: this.toUserSummary(item.user),
        priority: item.task.priority,
        submittedAt: item.submittedAt,
        dueAt: item.assignmentDueAt ?? item.task.dueAt,
        progressPercent: item.progressPercent,
        completionNote: item.completionNote,
      })),
      total,
      query.page,
      query.limit,
    );
  }

  async timeline(id: string, actor: AuthenticatedUser, query: TaskTimelineQueryDto) {
    await this.findOne(id, actor);
    const where: Prisma.TaskStatusHistoryWhereInput = { taskId: id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.taskStatusHistory.findMany({
        where,
        include: { actor: { select: this.safeUserSelect() } },
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.taskStatusHistory.count({ where }),
    ]);
    return this.paginate(
      items.map((item) => ({
        id: item.id,
        type: this.toTimelineType(item.action),
        actor: item.actor ? this.toUserSummary(item.actor) : null,
        createdAt: item.createdAt,
        data: {
          taskId: item.taskId,
          assignmentId: item.assignmentId,
          oldStatus: item.fromStatus,
          newStatus: item.toStatus,
          note: item.note,
          action: item.action,
          metadata: item.metadata,
        },
      })),
      total,
      query.page,
      query.limit,
    );
  }

  async pendingExtensions(actor: AuthenticatedUser, query: TaskExtensionPendingQueryDto) {
    const assignmentWhere = await this.assignmentScopeWhere(actor, query.departmentId);
    const where: Prisma.TaskExtensionRequestWhereInput = {
      status: 'PENDING',
      assignment: assignmentWhere,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.taskExtensionRequest.findMany({
        where,
        include: {
          assignment: { include: { user: { select: this.safeUserSelect() }, task: { select: { id: true, title: true, dueAt: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.taskExtensionRequest.count({ where }),
    ]);
    return this.paginate(
      items.map((item) => ({
        id: item.id,
        taskId: item.taskId,
        taskTitle: item.assignment.task.title,
        assignmentId: item.assignmentId,
        employee: this.toUserSummary(item.assignment.user),
        oldDueAt: item.currentDueAt ?? item.assignment.assignmentDueAt ?? item.assignment.task.dueAt,
        requestedDueAt: item.requestedDueAt,
        reason: item.reason,
        createdAt: item.createdAt,
      })),
      total,
      query.page,
      query.limit,
    );
  }

  async update(id: string, dto: UpdateTaskDto, actor: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.deletedAt) throw notFound('TASK_NOT_FOUND', 'Task not found');
    this.assertCanManageTask(task.departmentContextId, actor);
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
      include: this.taskDetailInclude(),
    });
    return updated;
  }

  async cancel(id: string, actor: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.deletedAt) throw notFound('TASK_NOT_FOUND', 'Task not found');
    this.assertCanManageTask(task.departmentContextId, actor);
    return this.prisma.$transaction(async (tx) => {
      await tx.taskAssignment.updateMany({
        where: { taskId: id, status: { notIn: [TaskAssignmentStatus.COMPLETED, TaskAssignmentStatus.CANCELLED] } },
        data: { status: TaskAssignmentStatus.CANCELLED },
      });
      return tx.task.update({
        where: { id },
        data: { status: TaskStatus.CANCELLED, cancelledAt: new Date() },
        include: this.taskDetailInclude(),
      });
    });
  }

  async acceptAssignment(assignmentId: string, actor: AuthenticatedUser) {
    return this.changeOwnAssignment(assignmentId, actor, TaskAssignmentStatus.ACCEPTED, TaskHistoryAction.ACCEPTED, {});
  }

  async startAssignment(assignmentId: string, actor: AuthenticatedUser) {
    return this.changeOwnAssignment(assignmentId, actor, TaskAssignmentStatus.IN_PROGRESS, TaskHistoryAction.STARTED, {});
  }

  async updateProgress(assignmentId: string, dto: UpdateProgressDto, actor: AuthenticatedUser) {
    const assignment = await this.assertOwnAssignment(assignmentId, actor);
    const editableStatuses: TaskAssignmentStatus[] = [
      TaskAssignmentStatus.ACCEPTED,
      TaskAssignmentStatus.IN_PROGRESS,
      TaskAssignmentStatus.REJECTED,
    ];
    if (!editableStatuses.includes(assignment.status)) {
      throw badRequest('TASK_ASSIGNMENT_NOT_EDITABLE', 'Assignment cannot update progress now');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.taskAssignment.update({
        where: { id: assignmentId },
        data: { progressPercent: dto.progressPercent, status: TaskAssignmentStatus.IN_PROGRESS },
        include: { task: true },
      });
      await tx.taskStatusHistory.create({
        data: {
          taskId: updated.taskId,
          assignmentId,
          actorUserId: actor.userId,
          action: TaskHistoryAction.PROGRESS_UPDATED,
          metadata: { progressPercent: dto.progressPercent },
        },
      });
      return updated;
    });
  }

  async submitAssignment(assignmentId: string, dto: SubmitTaskDto, actor: AuthenticatedUser) {
    return this.changeOwnAssignment(assignmentId, actor, TaskAssignmentStatus.WAITING_REVIEW, TaskHistoryAction.SUBMITTED, {
      completionNote: dto.completionNote,
      submittedAt: new Date(),
    });
  }

  async completeTask(id: string, actor: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({ where: { id }, include: { assignments: true } });
    if (!task || task.deletedAt) throw notFound('TASK_NOT_FOUND', 'Task not found');
    if (task.groupLeaderId !== actor.userId && !actor.roles.includes('ADMIN')) {
      throw forbidden('NOT_GROUP_LEADER', 'Only the group leader can complete this task');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.taskAssignment.updateMany({
        where: { taskId: id, status: { notIn: [TaskAssignmentStatus.CANCELLED, TaskAssignmentStatus.COMPLETED] } },
        data: { status: TaskAssignmentStatus.COMPLETED, progressPercent: 100 },
      });
      const updated = await tx.task.update({
        where: { id },
        data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
        include: this.taskDetailInclude(),
      });
      await tx.taskStatusHistory.create({
        data: {
          taskId: id,
          actorUserId: actor.userId,
          action: TaskHistoryAction.APPROVED,
          toStatus: TaskStatus.COMPLETED,
        },
      });
      return updated;
    });
  }

  async approveAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser) {
    return this.reviewAssignment(assignmentId, dto, actor, TaskAssignmentStatus.COMPLETED, TaskHistoryAction.APPROVED);
  }

  async rejectAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser) {
    return this.reviewAssignment(assignmentId, dto, actor, TaskAssignmentStatus.REJECTED, TaskHistoryAction.REJECTED);
  }

  async comment(taskId: string, dto: CreateTaskCommentDto, actor: AuthenticatedUser) {
    await this.assertCanViewTask(taskId, actor);
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.taskComment.create({ data: { taskId, userId: actor.userId, content: dto.content } });
      await tx.taskStatusHistory.create({
        data: { taskId, actorUserId: actor.userId, action: TaskHistoryAction.COMMENTED },
      });
      return comment;
    });
  }

  async attach(taskId: string, dto: CreateTaskAttachmentDto, actor: AuthenticatedUser) {
    await this.assertCanViewTask(taskId, actor);
    return this.prisma.$transaction(async (tx) => {
      const attachment = await tx.taskAttachment.create({
        data: {
          taskId,
          uploadedByUserId: actor.userId,
          type: dto.type,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          storageKey: dto.storageKey,
          mimeType: dto.mimeType,
          sizeBytes: dto.sizeBytes,
        },
      });
      await tx.taskStatusHistory.create({
        data: { taskId, actorUserId: actor.userId, action: TaskHistoryAction.ATTACHED },
      });
      return attachment;
    });
  }

  async requestExtension(taskId: string, dto: CreateTaskExtensionRequestDto, actor: AuthenticatedUser) {
    const assignment = await this.assertOwnAssignment(dto.assignmentId, actor);
    if (assignment.taskId !== taskId) throw badRequest('TASK_ASSIGNMENT_MISMATCH', 'Assignment does not belong to task');
    if (new Date(dto.requestedDueAt) <= new Date()) {
      throw badRequest('INVALID_EXTENSION_DUE_AT', 'Requested due date must be in the future');
    }
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.taskExtensionRequest.create({
        data: {
          taskId,
          assignmentId: dto.assignmentId,
          requestedByUserId: actor.userId,
          currentDueAt: assignment.assignmentDueAt,
          requestedDueAt: new Date(dto.requestedDueAt),
          reason: dto.reason,
        },
      });
      await tx.taskStatusHistory.create({
        data: {
          taskId,
          assignmentId: dto.assignmentId,
          actorUserId: actor.userId,
          action: TaskHistoryAction.EXTENSION_REQUESTED,
        },
      });
      return request;
    });
  }

  async approveExtension(id: string, actor: AuthenticatedUser) {
    return this.decideExtension(id, actor, true);
  }

  async rejectExtension(id: string, actor: AuthenticatedUser, reason?: string) {
    return this.decideExtension(id, actor, false, reason);
  }

  private async changeOwnAssignment(
    assignmentId: string,
    actor: AuthenticatedUser,
    status: TaskAssignmentStatus,
    action: TaskHistoryAction,
    data: Prisma.TaskAssignmentUpdateInput,
  ) {
    const assignment = await this.assertOwnAssignment(assignmentId, actor);
    this.policy.assertAssignmentTransition(assignment.status, status);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.taskAssignment.update({
        where: { id: assignmentId },
        data: { ...data, status, acceptedAt: status === TaskAssignmentStatus.ACCEPTED ? new Date() : undefined, startedAt: status === TaskAssignmentStatus.IN_PROGRESS ? new Date() : undefined },
        include: { task: true },
      });
      await tx.taskStatusHistory.create({
        data: { taskId: updated.taskId, assignmentId, actorUserId: actor.userId, action, fromStatus: assignment.status, toStatus: status },
      });
      await this.syncTaskStatus(tx, updated.taskId);
      return updated;
    });
  }

  private async reviewAssignment(
    assignmentId: string,
    dto: ReviewTaskDto,
    actor: AuthenticatedUser,
    status: TaskAssignmentStatus,
    action: TaskHistoryAction,
  ) {
    const assignment = await this.prisma.taskAssignment.findUnique({ where: { id: assignmentId }, include: { task: true } });
    if (!assignment) throw notFound('TASK_ASSIGNMENT_NOT_FOUND', 'Assignment not found');
    this.scope.assertDepartmentAccess(actor, assignment.task.departmentContextId ?? (await this.scope.getPrimaryDepartmentId(assignment.userId)));
    this.policy.assertAssignmentTransition(assignment.status, status);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.taskAssignment.update({
        where: { id: assignmentId },
        data: {
          status,
          reviewedByUserId: actor.userId,
          reviewedAt: new Date(),
          completedAt: status === TaskAssignmentStatus.COMPLETED ? new Date() : undefined,
          reviewNote: dto.note,
        },
        include: { task: true },
      });
      await tx.taskStatusHistory.create({
        data: { taskId: updated.taskId, assignmentId, actorUserId: actor.userId, action, fromStatus: assignment.status, toStatus: status, note: dto.note },
      });
      await this.syncTaskStatus(tx, updated.taskId);
      return updated;
    });
  }

  private async decideExtension(id: string, actor: AuthenticatedUser, approve: boolean, reason?: string) {
    const request = await this.prisma.taskExtensionRequest.findUnique({
      where: { id },
      include: { assignment: { include: { task: true } } },
    });
    if (!request) throw notFound('TASK_EXTENSION_NOT_FOUND', 'Extension request not found');
    this.scope.assertDepartmentAccess(
      actor,
      request.assignment.task.departmentContextId ?? (await this.scope.getPrimaryDepartmentId(request.assignment.userId)),
    );
    if (request.status !== 'PENDING') throw conflict('TASK_EXTENSION_ALREADY_PROCESSED', 'Extension request already processed');
    return this.prisma.$transaction(async (tx) => {
      if (approve) {
        await tx.taskAssignment.update({
          where: { id: request.assignmentId },
          data: { assignmentDueAt: request.requestedDueAt },
        });
      }
      const updated = await tx.taskExtensionRequest.update({
        where: { id },
        data: {
          status: approve ? 'APPROVED' : 'REJECTED',
          rejectionReason: approve ? undefined : reason,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
      });
      await tx.taskStatusHistory.create({
        data: {
          taskId: request.taskId,
          assignmentId: request.assignmentId,
          actorUserId: actor.userId,
          action: approve ? TaskHistoryAction.EXTENSION_APPROVED : TaskHistoryAction.EXTENSION_REJECTED,
        },
      });
      return updated;
    });
  }

  private async assertOwnAssignment(assignmentId: string, actor: AuthenticatedUser) {
    const assignment = await this.prisma.taskAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw notFound('TASK_ASSIGNMENT_NOT_FOUND', 'Assignment not found');
    if (assignment.userId !== actor.userId) throw forbidden('TASK_ASSIGNMENT_OWNER_ONLY', 'Only assignee can perform this action');
    return assignment;
  }

  private async assertCanViewTask(taskId: string, actor: AuthenticatedUser): Promise<void> {
    if (this.has(actor, 'task.read_all')) return;
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: { select: { userId: true } } },
    });
    if (!task) throw notFound('TASK_NOT_FOUND', 'Task not found');
    if (task.createdByUserId === actor.userId || task.assignments.some((item) => item.userId === actor.userId)) return;
    const visible = this.scope.visibleDepartmentIds(actor);
    if (task.departmentContextId && visible?.includes(task.departmentContextId)) return;
    throw forbidden('TASK_FORBIDDEN', 'Cannot access this task');
  }

  private assertCanManageTask(departmentId: string | null, actor: AuthenticatedUser): void {
    if (this.has(actor, 'task.assign_any')) return;
    if (!this.has(actor, 'task.assign_department')) throw forbidden('TASK_FORBIDDEN', 'Cannot manage task');
    if (!departmentId) throw forbidden('TASK_DEPARTMENT_CONTEXT_REQUIRED', 'Department task context is required');
    this.scope.assertDepartmentAccess(actor, departmentId);
  }

  private assertCanCreate(dto: CreateTaskDto, actor: AuthenticatedUser): void {
    if (this.has(actor, 'task.assign_any')) return;
    if (!this.has(actor, 'task.assign_department')) throw forbidden('TASK_FORBIDDEN', 'Cannot create task');
    const departmentTargets = dto.targets?.filter((target) => target.targetType === TaskTargetType.DEPARTMENT) ?? [];
    for (const target of departmentTargets) this.scope.assertDepartmentAccess(actor, target.targetId);
  }

  private async resolveAssignees(dto: CreateTaskDto, actor: AuthenticatedUser): Promise<string[]> {
    if (dto.isAdhocGroup && dto.leaderId) {
      return [dto.leaderId];
    }
    const userIds = new Set<string>();
    for (const target of dto.targets ?? []) {
      if (target.targetType === TaskTargetType.USER) userIds.add(target.targetId);
      if (target.targetType === TaskTargetType.DEPARTMENT) {
        const members = await this.prisma.departmentMember.findMany({
          where: { departmentId: target.targetId, leftAt: null, user: { isActive: true, accountStatus: AccountStatus.ACTIVE } },
          select: { userId: true },
        });
        members.forEach((member) => userIds.add(member.userId));
      }
      if (target.targetType === TaskTargetType.GROUP) {
        const members = await this.prisma.taskGroupMember.findMany({
          where: { groupId: target.targetId, user: { isActive: true, accountStatus: AccountStatus.ACTIVE } },
          select: { userId: true, group: { select: { departmentId: true } } },
        });
        members.forEach((member) => userIds.add(member.userId));
      }
    }
    if (!this.has(actor, 'task.assign_any')) {
      const departmentId = dto.departmentContextId ?? (await this.scope.getPrimaryDepartmentId(actor.userId));
      this.scope.assertDepartmentAccess(actor, departmentId);
      for (const userId of userIds) await this.scope.assertUserInDepartment(userId, departmentId);
    }
    return [...userIds];
  }

  private async syncTaskStatus(tx: Prisma.TransactionClient, taskId: string): Promise<void> {
    const assignments = await tx.taskAssignment.findMany({ where: { taskId } });
    let status: TaskStatus = TaskStatus.NEW;
    if (assignments.every((item) => item.status === TaskAssignmentStatus.COMPLETED)) status = TaskStatus.COMPLETED;
    else if (assignments.some((item) => item.status === TaskAssignmentStatus.WAITING_REVIEW)) status = TaskStatus.WAITING_REVIEW;
    else if (assignments.some((item) => item.status === TaskAssignmentStatus.IN_PROGRESS)) status = TaskStatus.IN_PROGRESS;
    else if (assignments.some((item) => item.status === TaskAssignmentStatus.ACCEPTED)) status = TaskStatus.ACCEPTED;
    await tx.task.update({
      where: { id: taskId },
      data: { status, completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined },
    });
  }

  private inferTaskType(dto: CreateTaskDto): TaskType {
    if (dto.isAdhocGroup) return TaskType.GROUP;
    if (dto.targets?.some((target) => target.targetType === TaskTargetType.GROUP)) return TaskType.GROUP;
    if (dto.targets?.some((target) => target.targetType === TaskTargetType.DEPARTMENT)) return TaskType.DEPARTMENT;
    return TaskType.INDIVIDUAL;
  }

  private has(actor: AuthenticatedUser, permission: string): boolean {
    return actor.permissions.includes(permission) || actor.roles.includes('ADMIN');
  }

  private async taskWhereForActor(actor: AuthenticatedUser, query: TaskQueryDto, ownOnly: boolean): Promise<Prisma.TaskWhereInput> {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { taskCode: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.createdById ? { createdByUserId: query.createdById } : {}),
      ...(query.fromDate || query.toDate ? { createdAt: this.dateRange(query.fromDate, query.toDate) } : {}),
      ...(query.overdue ? { dueAt: { lt: new Date() }, status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] } } : {}),
    };

    if (query.status) {
      const taskStatuses = Object.values(TaskStatus) as string[];
      if (taskStatuses.includes(query.status)) where.status = query.status as TaskStatus;
      else where.assignments = { some: { status: query.status as TaskAssignmentStatus } };
    }
    if (query.assignedUserId) {
      where.assignments = {
        some: {
          ...(typeof where.assignments === 'object' && 'some' in where.assignments && typeof where.assignments.some === 'object'
            ? where.assignments.some
            : {}),
          userId: query.assignedUserId,
        },
      };
    }

    if (ownOnly || (!this.has(actor, 'task.read_all') && !this.scope.visibleDepartmentIds(actor)?.length)) {
      where.AND = [...this.toAndArray(where.AND), { OR: [{ createdByUserId: actor.userId }, { assignments: { some: { userId: actor.userId } } }] }];
      return where;
    }

    if (this.has(actor, 'task.read_all')) {
      if (query.departmentId) where.departmentContextId = query.departmentId;
      return where;
    }

    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor) ?? [];
    if (query.departmentId) this.scope.assertDepartmentAccess(actor, query.departmentId);
    where.departmentContextId = query.departmentId ?? { in: visibleDepartmentIds };
    return where;
  }

  private async assignmentScopeWhere(actor: AuthenticatedUser, departmentId?: string): Promise<Prisma.TaskAssignmentWhereInput> {
    if (this.has(actor, 'task.review_all') || this.has(actor, 'task.extension_review_all')) {
      return departmentId
        ? {
            OR: [
              { task: { departmentContextId: departmentId } },
              { user: { departmentLinks: { some: { departmentId, leftAt: null } } } },
            ],
          }
        : {};
    }
    if (departmentId) this.scope.assertDepartmentAccess(actor, departmentId);
    const visible = departmentId ? [departmentId] : this.scope.visibleDepartmentIds(actor) ?? [];
    if (!visible.length) throw forbidden('TASK_REVIEW_FORBIDDEN', 'Cannot review task assignments');
    return {
      OR: [
        { task: { departmentContextId: { in: visible } } },
        { user: { departmentLinks: { some: { departmentId: { in: visible }, leftAt: null } } } },
      ],
    };
  }

  private dateRange(fromDate?: string, toDate?: string): Prisma.DateTimeFilter {
    return {
      ...(fromDate ? { gte: new Date(fromDate) } : {}),
      ...(toDate ? { lte: new Date(toDate) } : {}),
    };
  }

  private toAndArray(and: Prisma.TaskWhereInput['AND']): Prisma.TaskWhereInput[] {
    if (!and) return [];
    return Array.isArray(and) ? and : [and];
  }

  private paginate<T>(items: T[], total: number, page: number, limit: number) {
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private taskListInclude() {
    return {
      targets: true,
      assignments: {
        include: {
          user: { select: this.safeUserSelect() },
        },
      },
      departmentContext: { select: { id: true, code: true, name: true } },
      createdBy: { select: this.safeUserSelect() },
    };
  }

  private taskDetailInclude() {
    return {
      childTasks: {
        select: {
          id: true,
          taskCode: true,
          title: true,
          status: true,
          priority: true,
          assignments: {
            include: { user: { select: this.safeUserSelect() } },
          },
        },
      },
      targets: true,
      departmentContext: { select: { id: true, code: true, name: true } },
      createdBy: { select: this.safeUserSelect() },
      assignments: {
        include: {
          user: { select: this.safeUserSelect() },
        },
      },
      comments: { include: { user: { select: this.safeUserSelect() } }, orderBy: { createdAt: 'asc' as const } },
      attachments: { orderBy: { createdAt: 'asc' as const } },
      extensionRequests: { orderBy: { createdAt: 'desc' as const }, take: 5 },
      histories: { include: { actor: { select: this.safeUserSelect() } }, orderBy: { createdAt: 'asc' as const }, take: 50 },
      chatGroup: { select: { id: true } },
    };
  }

  private safeUserSelect() {
    return {
      id: true,
      userCode: true,
      profile: { select: { fullName: true, avatarUrl: true, employmentStatus: true, position: { select: { id: true, name: true } } } },
    };
  }

  private toUserSummary(user: { id: string; userCode: string; profile?: { fullName?: string | null; avatarUrl?: string | null; employmentStatus?: string | null; position?: { id: string; name: string } | null } | null }) {
    return {
      id: user.id,
      userCode: user.userCode,
      fullName: user.profile?.fullName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      employmentStatus: user.profile?.employmentStatus ?? null,
      position: user.profile?.position ?? null,
    };
  }

  private async enrichTaskDetail<T extends { targets: Array<{ targetType: TaskTargetType; targetId: string }> }>(task: T) {
    const targetIds = task.targets.map((target) => target.targetId);
    const [users, departments, groups] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: targetIds } }, select: this.safeUserSelect() }),
      this.prisma.department.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true } }),
      this.prisma.taskGroup.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true } }),
    ]);
    const names = new Map<string, string | null>();
    users.forEach((user) => names.set(user.id, user.profile?.fullName ?? user.userCode));
    departments.forEach((department) => names.set(department.id, department.name));
    groups.forEach((group) => names.set(group.id, group.name));
    return {
      ...task,
      creator: 'createdBy' in task ? task.createdBy : undefined,
      targets: task.targets.map((target) => ({
        ...target,
        type: target.targetType,
        id: target.targetId,
        displayName: names.get(target.targetId) ?? null,
      })),
      latestExtensionRequest: 'extensionRequests' in task && Array.isArray(task.extensionRequests) ? task.extensionRequests[0] ?? null : null,
      pendingExtensionRequest:
        'extensionRequests' in task && Array.isArray(task.extensionRequests)
          ? task.extensionRequests.find((item: { status: string }) => item.status === 'PENDING') ?? null
          : null,
    };
  }

  private toTimelineType(action: TaskHistoryAction): string {
    const map: Record<TaskHistoryAction, string> = {
      [TaskHistoryAction.CREATED]: 'TASK_CREATED',
      [TaskHistoryAction.ASSIGNED]: 'ASSIGNMENT_CREATED',
      [TaskHistoryAction.ACCEPTED]: 'STATUS_CHANGED',
      [TaskHistoryAction.STARTED]: 'STATUS_CHANGED',
      [TaskHistoryAction.PROGRESS_UPDATED]: 'PROGRESS_UPDATED',
      [TaskHistoryAction.SUBMITTED]: 'TASK_SUBMITTED',
      [TaskHistoryAction.APPROVED]: 'REVIEW_APPROVED',
      [TaskHistoryAction.REJECTED]: 'REVIEW_REJECTED',
      [TaskHistoryAction.CANCELLED]: 'STATUS_CHANGED',
      [TaskHistoryAction.COMMENTED]: 'COMMENT_ADDED',
      [TaskHistoryAction.ATTACHED]: 'ATTACHMENT_ADDED',
      [TaskHistoryAction.EXTENSION_REQUESTED]: 'EXTENSION_REQUESTED',
      [TaskHistoryAction.EXTENSION_APPROVED]: 'EXTENSION_APPROVED',
      [TaskHistoryAction.EXTENSION_REJECTED]: 'EXTENSION_REJECTED',
    };
    return map[action];
  }
}
