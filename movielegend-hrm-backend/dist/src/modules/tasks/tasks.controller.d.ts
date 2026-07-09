import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateTaskAttachmentDto, CreateTaskCommentDto, CreateTaskDto, CreateTaskExtensionRequestDto, ReviewTaskDto, SubmitTaskDto, TaskExtensionPendingQueryDto, TaskQueryDto, TaskReviewQueueQueryDto, TaskTimelineQueryDto, UpdateProgressDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasks;
    constructor(tasks: TasksService);
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
    timeline(id: string, actor: AuthenticatedUser, query: TaskTimelineQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, actor: AuthenticatedUser): Promise<any>;
    update(id: string, dto: UpdateTaskDto, actor: AuthenticatedUser): Promise<any>;
    cancel(id: string, actor: AuthenticatedUser): Promise<any>;
    comment(id: string, dto: CreateTaskCommentDto, actor: AuthenticatedUser): Promise<any>;
    attach(id: string, dto: CreateTaskAttachmentDto, actor: AuthenticatedUser): Promise<any>;
    requestExtension(id: string, dto: CreateTaskExtensionRequestDto, actor: AuthenticatedUser): Promise<any>;
}
export declare class TaskAssignmentsController {
    private readonly tasks;
    constructor(tasks: TasksService);
    reviewQueue(actor: AuthenticatedUser, query: TaskReviewQueueQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    accept(id: string, actor: AuthenticatedUser): Promise<any>;
    start(id: string, actor: AuthenticatedUser): Promise<any>;
    progress(id: string, dto: UpdateProgressDto, actor: AuthenticatedUser): Promise<any>;
    submit(id: string, dto: SubmitTaskDto, actor: AuthenticatedUser): Promise<any>;
    approve(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<any>;
    reject(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<any>;
}
export declare class TaskExtensionsController {
    private readonly tasks;
    constructor(tasks: TasksService);
    pending(actor: AuthenticatedUser, query: TaskExtensionPendingQueryDto): Promise<{
        items: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    approve(id: string, actor: AuthenticatedUser): Promise<any>;
    reject(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<any>;
}
