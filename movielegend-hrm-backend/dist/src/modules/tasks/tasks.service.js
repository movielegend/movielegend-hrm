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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const task_policy_service_1 = require("./task-policy.service");
let TasksService = class TasksService {
    prisma;
    scope;
    policy;
    notifications;
    constructor(prisma, scope, policy, notifications) {
        this.prisma = prisma;
        this.scope = scope;
        this.policy = policy;
        this.notifications = notifications;
    }
    async create(dto, actor) {
        this.assertCanCreate(dto, actor);
        if (dto.departmentContextId)
            this.scope.assertDepartmentAccess(actor, dto.departmentContextId);
        const assigneeIds = await this.resolveAssignees(dto, actor);
        if (!dto.isAdhocGroup && !assigneeIds.length)
            throw (0, error_util_1.badRequest)('TASK_TARGET_EMPTY', 'Task must have at least one assignee');
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
                            action: client_1.TaskHistoryAction.CREATED,
                            toStatus: client_1.TaskStatus.NEW,
                            metadata: { assigneeIds },
                        },
                    },
                },
                include: this.taskDetailInclude(),
            });
            if (dto.isAdhocGroup && dto.memberIds?.length) {
                const chatMemberSet = new Set([...dto.memberIds, actor.userId]);
                if (dto.leaderId)
                    chatMemberSet.add(dto.leaderId);
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
                type: client_1.NotificationType.TASK_ASSIGNED,
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
    async findAll(actor, query) {
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
    async findMine(actor, query) {
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
    async findOne(id, actor) {
        const task = await this.prisma.task.findUnique({ where: { id }, include: this.taskDetailInclude() });
        if (!task || task.deletedAt)
            throw (0, error_util_1.notFound)('TASK_NOT_FOUND', 'Task not found');
        await this.assertCanViewTask(id, actor);
        return this.enrichTaskDetail(task);
    }
    async reviewQueue(actor, query) {
        const where = await this.assignmentScopeWhere(actor, query.departmentId);
        where.status = client_1.TaskAssignmentStatus.WAITING_REVIEW;
        const taskWhere = {
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
        return this.paginate(items.map((item) => ({
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
        })), total, query.page, query.limit);
    }
    async timeline(id, actor, query) {
        await this.findOne(id, actor);
        const where = { taskId: id };
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
        return this.paginate(items.map((item) => ({
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
        })), total, query.page, query.limit);
    }
    async pendingExtensions(actor, query) {
        const assignmentWhere = await this.assignmentScopeWhere(actor, query.departmentId);
        const where = {
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
        return this.paginate(items.map((item) => ({
            id: item.id,
            taskId: item.taskId,
            taskTitle: item.assignment.task.title,
            assignmentId: item.assignmentId,
            employee: this.toUserSummary(item.assignment.user),
            oldDueAt: item.currentDueAt ?? item.assignment.assignmentDueAt ?? item.assignment.task.dueAt,
            requestedDueAt: item.requestedDueAt,
            reason: item.reason,
            createdAt: item.createdAt,
        })), total, query.page, query.limit);
    }
    async update(id, dto, actor) {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task || task.deletedAt)
            throw (0, error_util_1.notFound)('TASK_NOT_FOUND', 'Task not found');
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
    async cancel(id, actor) {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task || task.deletedAt)
            throw (0, error_util_1.notFound)('TASK_NOT_FOUND', 'Task not found');
        this.assertCanManageTask(task.departmentContextId, actor);
        return this.prisma.$transaction(async (tx) => {
            await tx.taskAssignment.updateMany({
                where: { taskId: id, status: { notIn: [client_1.TaskAssignmentStatus.COMPLETED, client_1.TaskAssignmentStatus.CANCELLED] } },
                data: { status: client_1.TaskAssignmentStatus.CANCELLED },
            });
            return tx.task.update({
                where: { id },
                data: { status: client_1.TaskStatus.CANCELLED, cancelledAt: new Date() },
                include: this.taskDetailInclude(),
            });
        });
    }
    async acceptAssignment(assignmentId, actor) {
        return this.changeOwnAssignment(assignmentId, actor, client_1.TaskAssignmentStatus.ACCEPTED, client_1.TaskHistoryAction.ACCEPTED, {});
    }
    async startAssignment(assignmentId, actor) {
        return this.changeOwnAssignment(assignmentId, actor, client_1.TaskAssignmentStatus.IN_PROGRESS, client_1.TaskHistoryAction.STARTED, {});
    }
    async updateProgress(assignmentId, dto, actor) {
        const assignment = await this.assertOwnAssignment(assignmentId, actor);
        const editableStatuses = [
            client_1.TaskAssignmentStatus.ACCEPTED,
            client_1.TaskAssignmentStatus.IN_PROGRESS,
            client_1.TaskAssignmentStatus.REJECTED,
        ];
        if (!editableStatuses.includes(assignment.status)) {
            throw (0, error_util_1.badRequest)('TASK_ASSIGNMENT_NOT_EDITABLE', 'Assignment cannot update progress now');
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.taskAssignment.update({
                where: { id: assignmentId },
                data: { progressPercent: dto.progressPercent, status: client_1.TaskAssignmentStatus.IN_PROGRESS },
                include: { task: true },
            });
            await tx.taskStatusHistory.create({
                data: {
                    taskId: updated.taskId,
                    assignmentId,
                    actorUserId: actor.userId,
                    action: client_1.TaskHistoryAction.PROGRESS_UPDATED,
                    metadata: { progressPercent: dto.progressPercent },
                },
            });
            return updated;
        });
    }
    async submitAssignment(assignmentId, dto, actor) {
        return this.changeOwnAssignment(assignmentId, actor, client_1.TaskAssignmentStatus.WAITING_REVIEW, client_1.TaskHistoryAction.SUBMITTED, {
            completionNote: dto.completionNote,
            submittedAt: new Date(),
        });
    }
    async completeTask(id, actor) {
        const task = await this.prisma.task.findUnique({ where: { id }, include: { assignments: true } });
        if (!task || task.deletedAt)
            throw (0, error_util_1.notFound)('TASK_NOT_FOUND', 'Task not found');
        if (task.groupLeaderId !== actor.userId && !actor.roles.includes('ADMIN')) {
            throw (0, error_util_1.forbidden)('NOT_GROUP_LEADER', 'Only the group leader can complete this task');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.taskAssignment.updateMany({
                where: { taskId: id, status: { notIn: [client_1.TaskAssignmentStatus.CANCELLED, client_1.TaskAssignmentStatus.COMPLETED] } },
                data: { status: client_1.TaskAssignmentStatus.COMPLETED, progressPercent: 100 },
            });
            const updated = await tx.task.update({
                where: { id },
                data: { status: client_1.TaskStatus.COMPLETED, completedAt: new Date() },
                include: this.taskDetailInclude(),
            });
            await tx.taskStatusHistory.create({
                data: {
                    taskId: id,
                    actorUserId: actor.userId,
                    action: client_1.TaskHistoryAction.APPROVED,
                    toStatus: client_1.TaskStatus.COMPLETED,
                },
            });
            return updated;
        });
    }
    async approveAssignment(assignmentId, dto, actor) {
        return this.reviewAssignment(assignmentId, dto, actor, client_1.TaskAssignmentStatus.COMPLETED, client_1.TaskHistoryAction.APPROVED);
    }
    async rejectAssignment(assignmentId, dto, actor) {
        return this.reviewAssignment(assignmentId, dto, actor, client_1.TaskAssignmentStatus.REJECTED, client_1.TaskHistoryAction.REJECTED);
    }
    async comment(taskId, dto, actor) {
        await this.assertCanViewTask(taskId, actor);
        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.taskComment.create({ data: { taskId, userId: actor.userId, content: dto.content } });
            await tx.taskStatusHistory.create({
                data: { taskId, actorUserId: actor.userId, action: client_1.TaskHistoryAction.COMMENTED },
            });
            return comment;
        });
    }
    async attach(taskId, dto, actor) {
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
                data: { taskId, actorUserId: actor.userId, action: client_1.TaskHistoryAction.ATTACHED },
            });
            return attachment;
        });
    }
    async requestExtension(taskId, dto, actor) {
        const assignment = await this.assertOwnAssignment(dto.assignmentId, actor);
        if (assignment.taskId !== taskId)
            throw (0, error_util_1.badRequest)('TASK_ASSIGNMENT_MISMATCH', 'Assignment does not belong to task');
        if (new Date(dto.requestedDueAt) <= new Date()) {
            throw (0, error_util_1.badRequest)('INVALID_EXTENSION_DUE_AT', 'Requested due date must be in the future');
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
                    action: client_1.TaskHistoryAction.EXTENSION_REQUESTED,
                },
            });
            return request;
        });
    }
    async approveExtension(id, actor) {
        return this.decideExtension(id, actor, true);
    }
    async rejectExtension(id, actor, reason) {
        return this.decideExtension(id, actor, false, reason);
    }
    async changeOwnAssignment(assignmentId, actor, status, action, data) {
        const assignment = await this.assertOwnAssignment(assignmentId, actor);
        this.policy.assertAssignmentTransition(assignment.status, status);
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.taskAssignment.update({
                where: { id: assignmentId },
                data: { ...data, status, acceptedAt: status === client_1.TaskAssignmentStatus.ACCEPTED ? new Date() : undefined, startedAt: status === client_1.TaskAssignmentStatus.IN_PROGRESS ? new Date() : undefined },
                include: { task: true },
            });
            await tx.taskStatusHistory.create({
                data: { taskId: updated.taskId, assignmentId, actorUserId: actor.userId, action, fromStatus: assignment.status, toStatus: status },
            });
            await this.syncTaskStatus(tx, updated.taskId);
            return updated;
        });
    }
    async reviewAssignment(assignmentId, dto, actor, status, action) {
        const assignment = await this.prisma.taskAssignment.findUnique({ where: { id: assignmentId }, include: { task: true } });
        if (!assignment)
            throw (0, error_util_1.notFound)('TASK_ASSIGNMENT_NOT_FOUND', 'Assignment not found');
        this.scope.assertDepartmentAccess(actor, assignment.task.departmentContextId ?? (await this.scope.getPrimaryDepartmentId(assignment.userId)));
        this.policy.assertAssignmentTransition(assignment.status, status);
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.taskAssignment.update({
                where: { id: assignmentId },
                data: {
                    status,
                    reviewedByUserId: actor.userId,
                    reviewedAt: new Date(),
                    completedAt: status === client_1.TaskAssignmentStatus.COMPLETED ? new Date() : undefined,
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
    async decideExtension(id, actor, approve, reason) {
        const request = await this.prisma.taskExtensionRequest.findUnique({
            where: { id },
            include: { assignment: { include: { task: true } } },
        });
        if (!request)
            throw (0, error_util_1.notFound)('TASK_EXTENSION_NOT_FOUND', 'Extension request not found');
        this.scope.assertDepartmentAccess(actor, request.assignment.task.departmentContextId ?? (await this.scope.getPrimaryDepartmentId(request.assignment.userId)));
        if (request.status !== 'PENDING')
            throw (0, error_util_1.conflict)('TASK_EXTENSION_ALREADY_PROCESSED', 'Extension request already processed');
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
                    action: approve ? client_1.TaskHistoryAction.EXTENSION_APPROVED : client_1.TaskHistoryAction.EXTENSION_REJECTED,
                },
            });
            return updated;
        });
    }
    async assertOwnAssignment(assignmentId, actor) {
        const assignment = await this.prisma.taskAssignment.findUnique({ where: { id: assignmentId } });
        if (!assignment)
            throw (0, error_util_1.notFound)('TASK_ASSIGNMENT_NOT_FOUND', 'Assignment not found');
        if (assignment.userId !== actor.userId)
            throw (0, error_util_1.forbidden)('TASK_ASSIGNMENT_OWNER_ONLY', 'Only assignee can perform this action');
        return assignment;
    }
    async assertCanViewTask(taskId, actor) {
        if (this.has(actor, 'task.read_all'))
            return;
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { assignments: { select: { userId: true } } },
        });
        if (!task)
            throw (0, error_util_1.notFound)('TASK_NOT_FOUND', 'Task not found');
        if (task.createdByUserId === actor.userId || task.assignments.some((item) => item.userId === actor.userId))
            return;
        const visible = this.scope.visibleDepartmentIds(actor);
        if (task.departmentContextId && visible?.includes(task.departmentContextId))
            return;
        throw (0, error_util_1.forbidden)('TASK_FORBIDDEN', 'Cannot access this task');
    }
    assertCanManageTask(departmentId, actor) {
        if (this.has(actor, 'task.assign_any'))
            return;
        if (!this.has(actor, 'task.assign_department'))
            throw (0, error_util_1.forbidden)('TASK_FORBIDDEN', 'Cannot manage task');
        if (!departmentId)
            throw (0, error_util_1.forbidden)('TASK_DEPARTMENT_CONTEXT_REQUIRED', 'Department task context is required');
        this.scope.assertDepartmentAccess(actor, departmentId);
    }
    assertCanCreate(dto, actor) {
        if (this.has(actor, 'task.assign_any'))
            return;
        if (!this.has(actor, 'task.assign_department'))
            throw (0, error_util_1.forbidden)('TASK_FORBIDDEN', 'Cannot create task');
        const departmentTargets = dto.targets?.filter((target) => target.targetType === client_1.TaskTargetType.DEPARTMENT) ?? [];
        for (const target of departmentTargets)
            this.scope.assertDepartmentAccess(actor, target.targetId);
    }
    async resolveAssignees(dto, actor) {
        if (dto.isAdhocGroup && dto.leaderId) {
            return [dto.leaderId];
        }
        const userIds = new Set();
        for (const target of dto.targets ?? []) {
            if (target.targetType === client_1.TaskTargetType.USER)
                userIds.add(target.targetId);
            if (target.targetType === client_1.TaskTargetType.DEPARTMENT) {
                const members = await this.prisma.departmentMember.findMany({
                    where: { departmentId: target.targetId, leftAt: null, user: { isActive: true, accountStatus: client_1.AccountStatus.ACTIVE } },
                    select: { userId: true },
                });
                members.forEach((member) => userIds.add(member.userId));
            }
            if (target.targetType === client_1.TaskTargetType.GROUP) {
                const members = await this.prisma.taskGroupMember.findMany({
                    where: { groupId: target.targetId, user: { isActive: true, accountStatus: client_1.AccountStatus.ACTIVE } },
                    select: { userId: true, group: { select: { departmentId: true } } },
                });
                members.forEach((member) => userIds.add(member.userId));
            }
        }
        if (!this.has(actor, 'task.assign_any')) {
            const departmentId = dto.departmentContextId ?? (await this.scope.getPrimaryDepartmentId(actor.userId));
            this.scope.assertDepartmentAccess(actor, departmentId);
            for (const userId of userIds)
                await this.scope.assertUserInDepartment(userId, departmentId);
        }
        return [...userIds];
    }
    async syncTaskStatus(tx, taskId) {
        const assignments = await tx.taskAssignment.findMany({ where: { taskId } });
        let status = client_1.TaskStatus.NEW;
        if (assignments.every((item) => item.status === client_1.TaskAssignmentStatus.COMPLETED))
            status = client_1.TaskStatus.COMPLETED;
        else if (assignments.some((item) => item.status === client_1.TaskAssignmentStatus.WAITING_REVIEW))
            status = client_1.TaskStatus.WAITING_REVIEW;
        else if (assignments.some((item) => item.status === client_1.TaskAssignmentStatus.IN_PROGRESS))
            status = client_1.TaskStatus.IN_PROGRESS;
        else if (assignments.some((item) => item.status === client_1.TaskAssignmentStatus.ACCEPTED))
            status = client_1.TaskStatus.ACCEPTED;
        await tx.task.update({
            where: { id: taskId },
            data: { status, completedAt: status === client_1.TaskStatus.COMPLETED ? new Date() : undefined },
        });
    }
    inferTaskType(dto) {
        if (dto.isAdhocGroup)
            return client_1.TaskType.GROUP;
        if (dto.targets?.some((target) => target.targetType === client_1.TaskTargetType.GROUP))
            return client_1.TaskType.GROUP;
        if (dto.targets?.some((target) => target.targetType === client_1.TaskTargetType.DEPARTMENT))
            return client_1.TaskType.DEPARTMENT;
        return client_1.TaskType.INDIVIDUAL;
    }
    has(actor, permission) {
        return actor.permissions.includes(permission) || actor.roles.includes('ADMIN');
    }
    async taskWhereForActor(actor, query, ownOnly) {
        const where = {
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
            ...(query.overdue ? { dueAt: { lt: new Date() }, status: { notIn: [client_1.TaskStatus.COMPLETED, client_1.TaskStatus.CANCELLED] } } : {}),
        };
        if (query.status) {
            const taskStatuses = Object.values(client_1.TaskStatus);
            if (taskStatuses.includes(query.status))
                where.status = query.status;
            else
                where.assignments = { some: { status: query.status } };
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
            if (query.departmentId)
                where.departmentContextId = query.departmentId;
            return where;
        }
        const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor) ?? [];
        if (query.departmentId)
            this.scope.assertDepartmentAccess(actor, query.departmentId);
        where.departmentContextId = query.departmentId ?? { in: visibleDepartmentIds };
        return where;
    }
    async assignmentScopeWhere(actor, departmentId) {
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
        if (departmentId)
            this.scope.assertDepartmentAccess(actor, departmentId);
        const visible = departmentId ? [departmentId] : this.scope.visibleDepartmentIds(actor) ?? [];
        if (!visible.length)
            throw (0, error_util_1.forbidden)('TASK_REVIEW_FORBIDDEN', 'Cannot review task assignments');
        return {
            OR: [
                { task: { departmentContextId: { in: visible } } },
                { user: { departmentLinks: { some: { departmentId: { in: visible }, leftAt: null } } } },
            ],
        };
    }
    dateRange(fromDate, toDate) {
        return {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate) } : {}),
        };
    }
    toAndArray(and) {
        if (!and)
            return [];
        return Array.isArray(and) ? and : [and];
    }
    paginate(items, total, page, limit) {
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
    taskListInclude() {
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
    taskDetailInclude() {
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
            comments: { include: { user: { select: this.safeUserSelect() } }, orderBy: { createdAt: 'asc' } },
            attachments: { orderBy: { createdAt: 'asc' } },
            extensionRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
            histories: { include: { actor: { select: this.safeUserSelect() } }, orderBy: { createdAt: 'asc' }, take: 50 },
            chatGroup: { select: { id: true } },
        };
    }
    safeUserSelect() {
        return {
            id: true,
            userCode: true,
            profile: { select: { fullName: true, avatarUrl: true, employmentStatus: true, position: { select: { id: true, name: true } } } },
        };
    }
    toUserSummary(user) {
        return {
            id: user.id,
            userCode: user.userCode,
            fullName: user.profile?.fullName ?? null,
            avatarUrl: user.profile?.avatarUrl ?? null,
            employmentStatus: user.profile?.employmentStatus ?? null,
            position: user.profile?.position ?? null,
        };
    }
    async enrichTaskDetail(task) {
        const targetIds = task.targets.map((target) => target.targetId);
        const [users, departments, groups] = await Promise.all([
            this.prisma.user.findMany({ where: { id: { in: targetIds } }, select: this.safeUserSelect() }),
            this.prisma.department.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true } }),
            this.prisma.taskGroup.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true } }),
        ]);
        const names = new Map();
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
            pendingExtensionRequest: 'extensionRequests' in task && Array.isArray(task.extensionRequests)
                ? task.extensionRequests.find((item) => item.status === 'PENDING') ?? null
                : null,
        };
    }
    toTimelineType(action) {
        const map = {
            [client_1.TaskHistoryAction.CREATED]: 'TASK_CREATED',
            [client_1.TaskHistoryAction.ASSIGNED]: 'ASSIGNMENT_CREATED',
            [client_1.TaskHistoryAction.ACCEPTED]: 'STATUS_CHANGED',
            [client_1.TaskHistoryAction.STARTED]: 'STATUS_CHANGED',
            [client_1.TaskHistoryAction.PROGRESS_UPDATED]: 'PROGRESS_UPDATED',
            [client_1.TaskHistoryAction.SUBMITTED]: 'TASK_SUBMITTED',
            [client_1.TaskHistoryAction.APPROVED]: 'REVIEW_APPROVED',
            [client_1.TaskHistoryAction.REJECTED]: 'REVIEW_REJECTED',
            [client_1.TaskHistoryAction.CANCELLED]: 'STATUS_CHANGED',
            [client_1.TaskHistoryAction.COMMENTED]: 'COMMENT_ADDED',
            [client_1.TaskHistoryAction.ATTACHED]: 'ATTACHMENT_ADDED',
            [client_1.TaskHistoryAction.EXTENSION_REQUESTED]: 'EXTENSION_REQUESTED',
            [client_1.TaskHistoryAction.EXTENSION_APPROVED]: 'EXTENSION_APPROVED',
            [client_1.TaskHistoryAction.EXTENSION_REJECTED]: 'EXTENSION_REJECTED',
        };
        return map[action];
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        task_policy_service_1.TaskPolicyService,
        notifications_service_1.NotificationsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map