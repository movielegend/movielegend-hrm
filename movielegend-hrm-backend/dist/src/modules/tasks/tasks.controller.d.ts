import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateTaskAttachmentDto, CreateTaskCommentDto, CreateTaskDto, CreateTaskExtensionRequestDto, ReviewTaskDto, SubmitTaskDto, TaskExtensionPendingQueryDto, TaskQueryDto, TaskReviewQueueQueryDto, TaskTimelineQueryDto, UpdateProgressDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasks;
    constructor(tasks: TasksService);
    create(dto: CreateTaskDto, actor: AuthenticatedUser): Promise<{
        chatGroup: {
            id: string;
        } | null;
        departmentContext: {
            id: string;
            code: string;
            name: string;
        } | null;
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
        childTasks: {
            id: string;
            taskCode: string;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
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
                id: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                startedAt: Date | null;
                submittedAt: Date | null;
                reviewedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
                userId: string;
                assignedByUserId: string;
                reviewedByUserId: string | null;
                taskId: string;
            })[];
        }[];
        targets: {
            id: string;
            createdAt: Date;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
            taskId: string;
        }[];
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
            id: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            startedAt: Date | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
            userId: string;
            assignedByUserId: string;
            reviewedByUserId: string | null;
            taskId: string;
        })[];
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            taskId: string;
            content: string;
        })[];
        attachments: {
            id: string;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            createdAt: Date;
            taskId: string;
            uploadedByUserId: string;
            fileName: string;
            fileUrl: string;
            storageKey: string | null;
            mimeType: string | null;
            sizeBytes: number | null;
        }[];
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
            assignmentId: string | null;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            fromStatus: string | null;
            toStatus: string | null;
            note: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            taskId: string;
        })[];
        extensionRequests: {
            id: string;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            assignmentId: string;
            taskId: string;
            requestedByUserId: string;
            decidedByUserId: string | null;
            currentDueAt: Date | null;
            requestedDueAt: Date;
            reason: string;
            rejectionReason: string | null;
            decidedAt: Date | null;
        }[];
    } & {
        id: string;
        taskCode: string;
        title: string;
        description: string | null;
        type: import("@prisma/client").$Enums.TaskType;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        startAt: Date | null;
        dueAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentContextId: string | null;
        createdByUserId: string;
        groupLeaderId: string | null;
        parentTaskId: string | null;
    }>;
    findAll(actor: AuthenticatedUser, query: TaskQueryDto): Promise<{
        items: ({
            departmentContext: {
                id: string;
                code: string;
                name: string;
            } | null;
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
            targets: {
                id: string;
                createdAt: Date;
                targetType: import("@prisma/client").$Enums.TaskTargetType;
                targetId: string;
                taskId: string;
            }[];
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
                id: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                startedAt: Date | null;
                submittedAt: Date | null;
                reviewedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
                userId: string;
                assignedByUserId: string;
                reviewedByUserId: string | null;
                taskId: string;
            })[];
        } & {
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
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
            departmentContext: {
                id: string;
                code: string;
                name: string;
            } | null;
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
            targets: {
                id: string;
                createdAt: Date;
                targetType: import("@prisma/client").$Enums.TaskTargetType;
                targetId: string;
                taskId: string;
            }[];
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
                id: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                startedAt: Date | null;
                submittedAt: Date | null;
                reviewedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
                userId: string;
                assignedByUserId: string;
                reviewedByUserId: string | null;
                taskId: string;
            })[];
        } & {
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
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
        chatGroup: {
            id: string;
        } | null;
        departmentContext: {
            id: string;
            code: string;
            name: string;
        } | null;
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
        childTasks: {
            id: string;
            taskCode: string;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
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
                id: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                startedAt: Date | null;
                submittedAt: Date | null;
                reviewedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
                userId: string;
                assignedByUserId: string;
                reviewedByUserId: string | null;
                taskId: string;
            })[];
        }[];
        targets: {
            id: string;
            createdAt: Date;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
            taskId: string;
        }[];
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
            id: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            startedAt: Date | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
            userId: string;
            assignedByUserId: string;
            reviewedByUserId: string | null;
            taskId: string;
        })[];
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            taskId: string;
            content: string;
        })[];
        attachments: {
            id: string;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            createdAt: Date;
            taskId: string;
            uploadedByUserId: string;
            fileName: string;
            fileUrl: string;
            storageKey: string | null;
            mimeType: string | null;
            sizeBytes: number | null;
        }[];
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
            assignmentId: string | null;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            fromStatus: string | null;
            toStatus: string | null;
            note: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            taskId: string;
        })[];
        extensionRequests: {
            id: string;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            assignmentId: string;
            taskId: string;
            requestedByUserId: string;
            decidedByUserId: string | null;
            currentDueAt: Date | null;
            requestedDueAt: Date;
            reason: string;
            rejectionReason: string | null;
            decidedAt: Date | null;
        }[];
    } & {
        id: string;
        taskCode: string;
        title: string;
        description: string | null;
        type: import("@prisma/client").$Enums.TaskType;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        startAt: Date | null;
        dueAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentContextId: string | null;
        createdByUserId: string;
        groupLeaderId: string | null;
        parentTaskId: string | null;
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
        chatGroup: {
            id: string;
        } | null;
        departmentContext: {
            id: string;
            code: string;
            name: string;
        } | null;
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
        childTasks: {
            id: string;
            taskCode: string;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
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
                id: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                startedAt: Date | null;
                submittedAt: Date | null;
                reviewedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
                userId: string;
                assignedByUserId: string;
                reviewedByUserId: string | null;
                taskId: string;
            })[];
        }[];
        targets: {
            id: string;
            createdAt: Date;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
            taskId: string;
        }[];
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
            id: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            startedAt: Date | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
            userId: string;
            assignedByUserId: string;
            reviewedByUserId: string | null;
            taskId: string;
        })[];
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            taskId: string;
            content: string;
        })[];
        attachments: {
            id: string;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            createdAt: Date;
            taskId: string;
            uploadedByUserId: string;
            fileName: string;
            fileUrl: string;
            storageKey: string | null;
            mimeType: string | null;
            sizeBytes: number | null;
        }[];
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
            assignmentId: string | null;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            fromStatus: string | null;
            toStatus: string | null;
            note: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            taskId: string;
        })[];
        extensionRequests: {
            id: string;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            assignmentId: string;
            taskId: string;
            requestedByUserId: string;
            decidedByUserId: string | null;
            currentDueAt: Date | null;
            requestedDueAt: Date;
            reason: string;
            rejectionReason: string | null;
            decidedAt: Date | null;
        }[];
    } & {
        id: string;
        taskCode: string;
        title: string;
        description: string | null;
        type: import("@prisma/client").$Enums.TaskType;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        startAt: Date | null;
        dueAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentContextId: string | null;
        createdByUserId: string;
        groupLeaderId: string | null;
        parentTaskId: string | null;
    }>;
    cancel(id: string, actor: AuthenticatedUser): Promise<{
        chatGroup: {
            id: string;
        } | null;
        departmentContext: {
            id: string;
            code: string;
            name: string;
        } | null;
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
        childTasks: {
            id: string;
            taskCode: string;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
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
                id: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                progressPercent: number;
                assignmentDueAt: Date | null;
                acceptedAt: Date | null;
                startedAt: Date | null;
                submittedAt: Date | null;
                reviewedAt: Date | null;
                reviewNote: string | null;
                completionNote: string | null;
                userId: string;
                assignedByUserId: string;
                reviewedByUserId: string | null;
                taskId: string;
            })[];
        }[];
        targets: {
            id: string;
            createdAt: Date;
            targetType: import("@prisma/client").$Enums.TaskTargetType;
            targetId: string;
            taskId: string;
        }[];
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
            id: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            progressPercent: number;
            assignmentDueAt: Date | null;
            acceptedAt: Date | null;
            startedAt: Date | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            reviewNote: string | null;
            completionNote: string | null;
            userId: string;
            assignedByUserId: string;
            reviewedByUserId: string | null;
            taskId: string;
        })[];
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            taskId: string;
            content: string;
        })[];
        attachments: {
            id: string;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
            createdAt: Date;
            taskId: string;
            uploadedByUserId: string;
            fileName: string;
            fileUrl: string;
            storageKey: string | null;
            mimeType: string | null;
            sizeBytes: number | null;
        }[];
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
            assignmentId: string | null;
            action: import("@prisma/client").$Enums.TaskHistoryAction;
            fromStatus: string | null;
            toStatus: string | null;
            note: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            taskId: string;
        })[];
        extensionRequests: {
            id: string;
            status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            assignmentId: string;
            taskId: string;
            requestedByUserId: string;
            decidedByUserId: string | null;
            currentDueAt: Date | null;
            requestedDueAt: Date;
            reason: string;
            rejectionReason: string | null;
            decidedAt: Date | null;
        }[];
    } & {
        id: string;
        taskCode: string;
        title: string;
        description: string | null;
        type: import("@prisma/client").$Enums.TaskType;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        startAt: Date | null;
        dueAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentContextId: string | null;
        createdByUserId: string;
        groupLeaderId: string | null;
        parentTaskId: string | null;
    }>;
    comment(id: string, dto: CreateTaskCommentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        taskId: string;
        content: string;
    }>;
    attach(id: string, dto: CreateTaskAttachmentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.TaskAttachmentType;
        createdAt: Date;
        taskId: string;
        uploadedByUserId: string;
        fileName: string;
        fileUrl: string;
        storageKey: string | null;
        mimeType: string | null;
        sizeBytes: number | null;
    }>;
    requestExtension(id: string, dto: CreateTaskExtensionRequestDto, actor: AuthenticatedUser): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        assignmentId: string;
        taskId: string;
        requestedByUserId: string;
        decidedByUserId: string | null;
        currentDueAt: Date | null;
        requestedDueAt: Date;
        reason: string;
        rejectionReason: string | null;
        decidedAt: Date | null;
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
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        startedAt: Date | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
        userId: string;
        assignedByUserId: string;
        reviewedByUserId: string | null;
        taskId: string;
    }>;
    start(id: string, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        startedAt: Date | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
        userId: string;
        assignedByUserId: string;
        reviewedByUserId: string | null;
        taskId: string;
    }>;
    progress(id: string, dto: UpdateProgressDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        startedAt: Date | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
        userId: string;
        assignedByUserId: string;
        reviewedByUserId: string | null;
        taskId: string;
    }>;
    submit(id: string, dto: SubmitTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        startedAt: Date | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
        userId: string;
        assignedByUserId: string;
        reviewedByUserId: string | null;
        taskId: string;
    }>;
    approve(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        startedAt: Date | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
        userId: string;
        assignedByUserId: string;
        reviewedByUserId: string | null;
        taskId: string;
    }>;
    reject(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            taskCode: string;
            title: string;
            description: string | null;
            type: import("@prisma/client").$Enums.TaskType;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            startAt: Date | null;
            dueAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentContextId: string | null;
            createdByUserId: string;
            groupLeaderId: string | null;
            parentTaskId: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        progressPercent: number;
        assignmentDueAt: Date | null;
        acceptedAt: Date | null;
        startedAt: Date | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        reviewNote: string | null;
        completionNote: string | null;
        userId: string;
        assignedByUserId: string;
        reviewedByUserId: string | null;
        taskId: string;
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
        status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        assignmentId: string;
        taskId: string;
        requestedByUserId: string;
        decidedByUserId: string | null;
        currentDueAt: Date | null;
        requestedDueAt: Date;
        reason: string;
        rejectionReason: string | null;
        decidedAt: Date | null;
    }>;
    reject(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TaskExtensionRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        assignmentId: string;
        taskId: string;
        requestedByUserId: string;
        decidedByUserId: string | null;
        currentDueAt: Date | null;
        requestedDueAt: Date;
        reason: string;
        rejectionReason: string | null;
        decidedAt: Date | null;
    }>;
}
