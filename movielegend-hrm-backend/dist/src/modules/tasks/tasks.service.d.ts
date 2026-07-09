import { Prisma, TaskTargetType } from '@prisma/client';
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
            metadata: Prisma.JsonValue | null;
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
            metadata: Prisma.JsonValue | null;
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
            targetType: TaskTargetType;
            targetId: string;
        }[];
        latestExtensionRequest: any;
        pendingExtensionRequest: any;
    }>;
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
                metadata: Prisma.JsonValue;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    pendingExtensions(actor: AuthenticatedUser, query: TaskExtensionPendingQueryDto): Promise<{
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
            metadata: Prisma.JsonValue | null;
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
            metadata: Prisma.JsonValue | null;
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
    acceptAssignment(assignmentId: string, actor: AuthenticatedUser): Promise<{
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
    startAssignment(assignmentId: string, actor: AuthenticatedUser): Promise<{
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
    updateProgress(assignmentId: string, dto: UpdateProgressDto, actor: AuthenticatedUser): Promise<{
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
    submitAssignment(assignmentId: string, dto: SubmitTaskDto, actor: AuthenticatedUser): Promise<{
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
    completeTask(id: string, actor: AuthenticatedUser): Promise<{
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
            metadata: Prisma.JsonValue | null;
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
    approveAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
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
    rejectAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
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
    comment(taskId: string, dto: CreateTaskCommentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        taskId: string;
        content: string;
    }>;
    attach(taskId: string, dto: CreateTaskAttachmentDto, actor: AuthenticatedUser): Promise<{
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
    requestExtension(taskId: string, dto: CreateTaskExtensionRequestDto, actor: AuthenticatedUser): Promise<{
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
    approveExtension(id: string, actor: AuthenticatedUser): Promise<{
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
    rejectExtension(id: string, actor: AuthenticatedUser, reason?: string): Promise<{
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
