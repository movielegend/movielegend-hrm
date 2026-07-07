import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateTaskAttachmentDto, CreateTaskCommentDto, CreateTaskDto, CreateTaskExtensionRequestDto, ReviewTaskDto, SubmitTaskDto, TaskExtensionPendingQueryDto, TaskQueryDto, TaskReviewQueueQueryDto, TaskTimelineQueryDto, UpdateProgressDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasks;
    constructor(tasks: TasksService);
    create(dto: CreateTaskDto, actor: AuthenticatedUser): Promise<{
        histories: ({
            actor: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
        })[];
        assignments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            assignedByUserId: string;
            taskId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            reviewedAt: Date | null;
            submittedAt: Date | null;
            reviewedByUserId: string | null;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
        })[];
        targets: {
            id: string;
            createdAt: Date;
            taskId: string;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
        }[];
        createdBy: {
            id: string;
            userCode: string;
            profile: {
                position: {
                    id: string;
                    name: string;
                } | null;
                fullName: string;
                avatarUrl: string | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            } | null;
        };
        departmentContext: {
            id: string;
            name: string;
            code: string;
        } | null;
        comments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            content: string;
            taskId: string;
        })[];
        attachments: {
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            id: string;
            createdAt: Date;
            storageKey: string | null;
            fileUrl: string;
            fileName: string;
            mimeType: string | null;
            taskId: string;
            sizeBytes: number | null;
            uploadedByUserId: string;
        }[];
        extensionRequests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            reason: string;
            rejectionReason: string | null;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            taskId: string;
            assignmentId: string;
            requestedDueAt: Date;
            requestedByUserId: string;
            currentDueAt: Date | null;
        }[];
    } & {
        type: import("@prisma/client").$Enums.TaskType;
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        parentTaskId: string | null;
        startAt: Date | null;
        dueAt: Date | null;
        cancelledAt: Date | null;
    }>;
    findAll(actor: AuthenticatedUser, query: TaskQueryDto): Promise<{
        items: ({
            assignments: ({
                user: {
                    id: string;
                    userCode: string;
                    profile: {
                        position: {
                            id: string;
                            name: string;
                        } | null;
                        fullName: string;
                        avatarUrl: string | null;
                        employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                    } | null;
                };
            } & {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                assignedByUserId: string;
                taskId: string;
                startedAt: Date | null;
                completedAt: Date | null;
                reviewedAt: Date | null;
                submittedAt: Date | null;
                reviewedByUserId: string | null;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
            })[];
            targets: {
                id: string;
                createdAt: Date;
                taskId: string;
                targetType: import("@prisma/client").$Enums.TaskTargetType;
                targetId: string;
            }[];
            createdBy: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
            departmentContext: {
                id: string;
                name: string;
                code: string;
            } | null;
        } & {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findMine(actor: AuthenticatedUser, query: TaskQueryDto): Promise<{
        items: ({
            assignments: ({
                user: {
                    id: string;
                    userCode: string;
                    profile: {
                        position: {
                            id: string;
                            name: string;
                        } | null;
                        fullName: string;
                        avatarUrl: string | null;
                        employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                    } | null;
                };
            } & {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                assignedByUserId: string;
                taskId: string;
                startedAt: Date | null;
                completedAt: Date | null;
                reviewedAt: Date | null;
                submittedAt: Date | null;
                reviewedByUserId: string | null;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
            })[];
            targets: {
                id: string;
                createdAt: Date;
                taskId: string;
                targetType: import("@prisma/client").$Enums.TaskTargetType;
                targetId: string;
            }[];
            createdBy: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
            departmentContext: {
                id: string;
                name: string;
                code: string;
            } | null;
        } & {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    timeline(id: string, actor: AuthenticatedUser, query: TaskTimelineQueryDto): Promise<{
        items: {
            id: string;
            type: string;
            actor: {
                id: string;
                userCode: string;
                fullName: string | null;
                avatarUrl: string | null;
                employmentStatus: string | null;
                position: {
                    id: string;
                    name: string;
                } | null;
            } | null;
            createdAt: Date;
            data: {
                taskId: string;
                assignmentId: string | null;
                oldStatus: string | null;
                newStatus: string | null;
                note: string | null;
                action: import("@prisma/client").$Enums.TaskHistoryAction;
                metadata: import("@prisma/client/runtime/library").JsonValue;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        histories: ({
            actor: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
        })[];
        assignments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            assignedByUserId: string;
            taskId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            reviewedAt: Date | null;
            submittedAt: Date | null;
            reviewedByUserId: string | null;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
        })[];
        targets: {
            id: string;
            createdAt: Date;
            taskId: string;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
        }[];
        createdBy: {
            id: string;
            userCode: string;
            profile: {
                position: {
                    id: string;
                    name: string;
                } | null;
                fullName: string;
                avatarUrl: string | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            } | null;
        };
        departmentContext: {
            id: string;
            name: string;
            code: string;
        } | null;
        comments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            content: string;
            taskId: string;
        })[];
        attachments: {
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            id: string;
            createdAt: Date;
            storageKey: string | null;
            fileUrl: string;
            fileName: string;
            mimeType: string | null;
            taskId: string;
            sizeBytes: number | null;
            uploadedByUserId: string;
        }[];
        extensionRequests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            reason: string;
            rejectionReason: string | null;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            taskId: string;
            assignmentId: string;
            requestedDueAt: Date;
            requestedByUserId: string;
            currentDueAt: Date | null;
        }[];
    } & {
        type: import("@prisma/client").$Enums.TaskType;
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        parentTaskId: string | null;
        startAt: Date | null;
        dueAt: Date | null;
        cancelledAt: Date | null;
    } & {
        creator: unknown;
        targets: {
            type: import("@prisma/client").$Enums.TaskTargetType;
            id: string;
            displayName: string | null;
            targetType: import("@prisma/client").TaskTargetType;
            targetId: string;
        }[];
        latestExtensionRequest: any;
        pendingExtensionRequest: any;
    }>;
    update(id: string, dto: UpdateTaskDto, actor: AuthenticatedUser): Promise<{
        histories: ({
            actor: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
        })[];
        assignments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            assignedByUserId: string;
            taskId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            reviewedAt: Date | null;
            submittedAt: Date | null;
            reviewedByUserId: string | null;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
        })[];
        targets: {
            id: string;
            createdAt: Date;
            taskId: string;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
        }[];
        createdBy: {
            id: string;
            userCode: string;
            profile: {
                position: {
                    id: string;
                    name: string;
                } | null;
                fullName: string;
                avatarUrl: string | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            } | null;
        };
        departmentContext: {
            id: string;
            name: string;
            code: string;
        } | null;
        comments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            content: string;
            taskId: string;
        })[];
        attachments: {
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            id: string;
            createdAt: Date;
            storageKey: string | null;
            fileUrl: string;
            fileName: string;
            mimeType: string | null;
            taskId: string;
            sizeBytes: number | null;
            uploadedByUserId: string;
        }[];
        extensionRequests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            reason: string;
            rejectionReason: string | null;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            taskId: string;
            assignmentId: string;
            requestedDueAt: Date;
            requestedByUserId: string;
            currentDueAt: Date | null;
        }[];
    } & {
        type: import("@prisma/client").$Enums.TaskType;
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        parentTaskId: string | null;
        startAt: Date | null;
        dueAt: Date | null;
        cancelledAt: Date | null;
    }>;
    cancel(id: string, actor: AuthenticatedUser): Promise<{
        histories: ({
            actor: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
        })[];
        assignments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            assignedByUserId: string;
            taskId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            reviewedAt: Date | null;
            submittedAt: Date | null;
            reviewedByUserId: string | null;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
        })[];
        targets: {
            id: string;
            createdAt: Date;
            taskId: string;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
        }[];
        createdBy: {
            id: string;
            userCode: string;
            profile: {
                position: {
                    id: string;
                    name: string;
                } | null;
                fullName: string;
                avatarUrl: string | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            } | null;
        };
        departmentContext: {
            id: string;
            name: string;
            code: string;
        } | null;
        comments: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            content: string;
            taskId: string;
        })[];
        attachments: {
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            id: string;
            createdAt: Date;
            storageKey: string | null;
            fileUrl: string;
            fileName: string;
            mimeType: string | null;
            taskId: string;
            sizeBytes: number | null;
            uploadedByUserId: string;
        }[];
        extensionRequests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            reason: string;
            rejectionReason: string | null;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            taskId: string;
            assignmentId: string;
            requestedDueAt: Date;
            requestedByUserId: string;
            currentDueAt: Date | null;
        }[];
    } & {
        type: import("@prisma/client").$Enums.TaskType;
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        parentTaskId: string | null;
        startAt: Date | null;
        dueAt: Date | null;
        cancelledAt: Date | null;
    }>;
    comment(id: string, dto: CreateTaskCommentDto, actor: AuthenticatedUser): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        content: string;
        taskId: string;
    }>;
    attach(id: string, dto: CreateTaskAttachmentDto, actor: AuthenticatedUser): Promise<{
        type: import("@prisma/client").$Enums.TaskAttachmentType;
        id: string;
        createdAt: Date;
        storageKey: string | null;
        fileUrl: string;
        fileName: string;
        mimeType: string | null;
        taskId: string;
        sizeBytes: number | null;
        uploadedByUserId: string;
    }>;
    requestExtension(id: string, dto: CreateTaskExtensionRequestDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
        reason: string;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        taskId: string;
        assignmentId: string;
        requestedDueAt: Date;
        requestedByUserId: string;
        currentDueAt: Date | null;
    }>;
}
export declare class TaskAssignmentsController {
    private readonly tasks;
    constructor(tasks: TasksService);
    reviewQueue(actor: AuthenticatedUser, query: TaskReviewQueueQueryDto): Promise<{
        items: {
            assignmentId: string;
            taskId: string;
            taskCode: string;
            taskTitle: string;
            employee: {
                id: string;
                userCode: string;
                fullName: string | null;
                avatarUrl: string | null;
                employmentStatus: string | null;
                position: {
                    id: string;
                    name: string;
                } | null;
            };
            priority: import("@prisma/client").$Enums.TaskPriority;
            submittedAt: Date | null;
            dueAt: Date | null;
            progressPercent: number;
            completionNote: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    accept(id: string, actor: AuthenticatedUser): Promise<{
        task: {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        assignedByUserId: string;
        taskId: string;
        startedAt: Date | null;
        completedAt: Date | null;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        reviewedByUserId: string | null;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
    }>;
    start(id: string, actor: AuthenticatedUser): Promise<{
        task: {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        assignedByUserId: string;
        taskId: string;
        startedAt: Date | null;
        completedAt: Date | null;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        reviewedByUserId: string | null;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
    }>;
    progress(id: string, dto: UpdateProgressDto, actor: AuthenticatedUser): Promise<{
        task: {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        assignedByUserId: string;
        taskId: string;
        startedAt: Date | null;
        completedAt: Date | null;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        reviewedByUserId: string | null;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
    }>;
    submit(id: string, dto: SubmitTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        assignedByUserId: string;
        taskId: string;
        startedAt: Date | null;
        completedAt: Date | null;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        reviewedByUserId: string | null;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
    }>;
    approve(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        assignedByUserId: string;
        taskId: string;
        startedAt: Date | null;
        completedAt: Date | null;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        reviewedByUserId: string | null;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
    }>;
    reject(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            type: import("@prisma/client").$Enums.TaskType;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        assignedByUserId: string;
        taskId: string;
        startedAt: Date | null;
        completedAt: Date | null;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        reviewedByUserId: string | null;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
    }>;
}
export declare class TaskExtensionsController {
    private readonly tasks;
    constructor(tasks: TasksService);
    pending(actor: AuthenticatedUser, query: TaskExtensionPendingQueryDto): Promise<{
        items: {
            id: string;
            taskId: string;
            taskTitle: string;
            assignmentId: string;
            employee: {
                id: string;
                userCode: string;
                fullName: string | null;
                avatarUrl: string | null;
                employmentStatus: string | null;
                position: {
                    id: string;
                    name: string;
                } | null;
            };
            oldDueAt: Date | null;
            requestedDueAt: Date;
            reason: string;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    approve(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
        reason: string;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        taskId: string;
        assignmentId: string;
        requestedDueAt: Date;
        requestedByUserId: string;
        currentDueAt: Date | null;
    }>;
    reject(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
        reason: string;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        taskId: string;
        assignmentId: string;
        requestedDueAt: Date;
        requestedByUserId: string;
        currentDueAt: Date | null;
    }>;
}
