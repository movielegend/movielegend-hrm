import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { CreateTaskAttachmentDto, CreateTaskCommentDto, CreateTaskDto, CreateTaskExtensionRequestDto, ReviewTaskDto, SubmitTaskDto, TaskExtensionPendingQueryDto, TaskQueryDto, TaskReviewQueueQueryDto, TaskTimelineQueryDto, UpdateProgressDto, UpdateTaskDto } from './dto/task.dto';
import { TaskPolicyService } from './task-policy.service';
export declare class TasksService {
    private readonly prisma;
    private readonly scope;
    private readonly policy;
    private readonly notifications;
    constructor(prisma: PrismaService, scope: DepartmentScopeService, policy: TaskPolicyService, notifications: NotificationsService);
    create(dto: CreateTaskDto, actor: AuthenticatedUser): Promise<any>;
    findAll(actor: AuthenticatedUser, query: TaskQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findMine(actor: AuthenticatedUser, query: TaskQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, actor: AuthenticatedUser): Promise<any>;
    reviewQueue(actor: AuthenticatedUser, query: TaskReviewQueueQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    timeline(id: string, actor: AuthenticatedUser, query: TaskTimelineQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    pendingExtensions(actor: AuthenticatedUser, query: TaskExtensionPendingQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    update(id: string, dto: UpdateTaskDto, actor: AuthenticatedUser): Promise<any>;
    cancel(id: string, actor: AuthenticatedUser): Promise<any>;
    acceptAssignment(assignmentId: string, actor: AuthenticatedUser): Promise<any>;
    startAssignment(assignmentId: string, actor: AuthenticatedUser): Promise<any>;
    updateProgress(assignmentId: string, dto: UpdateProgressDto, actor: AuthenticatedUser): Promise<any>;
    submitAssignment(assignmentId: string, dto: SubmitTaskDto, actor: AuthenticatedUser): Promise<any>;
    approveAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<any>;
    rejectAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<any>;
    comment(taskId: string, dto: CreateTaskCommentDto, actor: AuthenticatedUser): Promise<any>;
    attach(taskId: string, dto: CreateTaskAttachmentDto, actor: AuthenticatedUser): Promise<any>;
    requestExtension(taskId: string, dto: CreateTaskExtensionRequestDto, actor: AuthenticatedUser): Promise<any>;
    approveExtension(id: string, actor: AuthenticatedUser): Promise<any>;
    rejectExtension(id: string, actor: AuthenticatedUser, reason?: string): Promise<any>;
    private changeOwnAssignment;
    private reviewAssignment;
    private decideExtension;
    private assertOwnAssignment;
    private assertCanViewTask;
    private assertCanManageTask;
    private assertCanCreate;
    private resolveAssignees;
    private syncTaskStatus;
    private inferTaskType;
    private has;
    private taskWhereForActor;
    private assignmentScopeWhere;
    private dateRange;
    private toAndArray;
    private paginate;
    private taskListInclude;
    private taskDetailInclude;
    private safeUserSelect;
    private toUserSummary;
    private enrichTaskDetail;
    private toTimelineType;
}
