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
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            taskId: string;
            assignedByUserId: string;
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
            metadata: Prisma.JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
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
            code: string;
            name: string;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            content: string;
            taskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
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
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.TaskType;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        groupLeaderId: string | null;
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
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                taskId: string;
                assignedByUserId: string;
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
                code: string;
                name: string;
            } | null;
        } & {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
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
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                status: import("@prisma/client").$Enums.TaskAssignmentStatus;
                taskId: string;
                assignedByUserId: string;
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
                code: string;
                name: string;
            } | null;
        } & {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
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
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        chatGroup: {
            id: string;
        } | null;
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
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            taskId: string;
            assignedByUserId: string;
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
            metadata: Prisma.JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
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
            code: string;
            name: string;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            content: string;
            taskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
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
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.TaskType;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        groupLeaderId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            taskId: string;
            assignedByUserId: string;
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
            metadata: Prisma.JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
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
            code: string;
            name: string;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            content: string;
            taskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
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
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.TaskType;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        groupLeaderId: string | null;
        parentTaskId: string | null;
        startAt: Date | null;
        dueAt: Date | null;
        cancelledAt: Date | null;
    }>;
    cancel(id: string, actor: AuthenticatedUser): Promise<{
        chatGroup: {
            id: string;
        } | null;
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
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.TaskAssignmentStatus;
            taskId: string;
            assignedByUserId: string;
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
            metadata: Prisma.JsonValue | null;
            actorUserId: string | null;
            note: string | null;
            taskId: string;
            assignmentId: string | null;
            fromStatus: string | null;
            toStatus: string | null;
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
            code: string;
            name: string;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            content: string;
            taskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.TaskAttachmentType;
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
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.TaskType;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        createdByUserId: string;
        taskCode: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        departmentContextId: string | null;
        groupLeaderId: string | null;
        parentTaskId: string | null;
        startAt: Date | null;
        dueAt: Date | null;
        cancelledAt: Date | null;
    }>;
    acceptAssignment(assignmentId: string, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        taskId: string;
        assignedByUserId: string;
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
    startAssignment(assignmentId: string, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        taskId: string;
        assignedByUserId: string;
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
    updateProgress(assignmentId: string, dto: UpdateProgressDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        taskId: string;
        assignedByUserId: string;
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
    submitAssignment(assignmentId: string, dto: SubmitTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        taskId: string;
        assignedByUserId: string;
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
    approveAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        taskId: string;
        assignedByUserId: string;
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
    rejectAssignment(assignmentId: string, dto: ReviewTaskDto, actor: AuthenticatedUser): Promise<{
        task: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            type: import("@prisma/client").$Enums.TaskType;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            createdByUserId: string;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            departmentContextId: string | null;
            groupLeaderId: string | null;
            parentTaskId: string | null;
            startAt: Date | null;
            dueAt: Date | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.TaskAssignmentStatus;
        taskId: string;
        assignedByUserId: string;
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
    comment(taskId: string, dto: CreateTaskCommentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        content: string;
        taskId: string;
    }>;
    attach(taskId: string, dto: CreateTaskAttachmentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.TaskAttachmentType;
        storageKey: string | null;
        fileUrl: string;
        fileName: string;
        mimeType: string | null;
        taskId: string;
        sizeBytes: number | null;
        uploadedByUserId: string;
    }>;
    requestExtension(taskId: string, dto: CreateTaskExtensionRequestDto, actor: AuthenticatedUser): Promise<{
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
    approveExtension(id: string, actor: AuthenticatedUser): Promise<{
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
    rejectExtension(id: string, actor: AuthenticatedUser, reason?: string): Promise<{
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
