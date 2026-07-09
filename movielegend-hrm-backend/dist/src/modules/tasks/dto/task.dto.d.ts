import { TaskAttachmentType, TaskAssignmentStatus, TaskPriority, TaskStatus, TaskTargetType, TaskType } from '@prisma/client';
export declare class TaskQueryDto {
    search?: string;
    status?: TaskStatus | TaskAssignmentStatus;
    priority?: TaskPriority;
    departmentId?: string;
    assignedUserId?: string;
    createdById?: string;
    fromDate?: string;
    toDate?: string;
    overdue?: boolean;
    page: number;
    limit: number;
}
export declare class TaskReviewQueueQueryDto {
    departmentId?: string;
    priority?: TaskPriority;
    fromDate?: string;
    toDate?: string;
    page: number;
    limit: number;
}
export declare class TaskTimelineQueryDto {
    page: number;
    limit: number;
}
export declare class TaskExtensionPendingQueryDto {
    departmentId?: string;
    page: number;
    limit: number;
}
export declare class TaskTargetDto {
    targetType: TaskTargetType;
    targetId: string;
}
export declare class CreateTaskDto {
    title: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    departmentContextId?: string;
    parentTaskId?: string;
    startAt?: string;
    dueAt?: string;
    targets?: TaskTargetDto[];
    isAdhocGroup?: boolean;
    memberIds?: string[];
    leaderId?: string;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueAt?: string;
}
export declare class UpdateProgressDto {
    progressPercent: number;
}
export declare class ReviewTaskDto {
    note?: string;
}
export declare class SubmitTaskDto {
    completionNote?: string;
}
export declare class CreateTaskCommentDto {
    content: string;
}
export declare class CreateTaskAttachmentDto {
    fileName: string;
    fileUrl: string;
    storageKey?: string;
    type?: TaskAttachmentType;
    mimeType?: string;
    sizeBytes?: number;
}
export declare class CreateTaskExtensionRequestDto {
    assignmentId: string;
    requestedDueAt: string;
    reason: string;
}
