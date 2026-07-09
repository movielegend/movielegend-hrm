import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { CreateCrossDepartmentRequestDto, RejectCrossDepartmentRequestDto } from './dto/cross-department.dto';
export declare class CrossDepartmentService {
    private readonly prisma;
    private readonly scope;
    private readonly notifications;
    constructor(prisma: PrismaService, scope: DepartmentScopeService, notifications: NotificationsService);
    create(dto: CreateCrossDepartmentRequestDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        taskId: string | null;
        sourceDepartmentId: string;
        targetDepartmentId: string;
        requestCode: string;
        createdByUserId: string;
    }>;
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        taskId: string | null;
        sourceDepartmentId: string;
        targetDepartmentId: string;
        requestCode: string;
        createdByUserId: string;
    }[]>;
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        requester: {
            id: string;
            userCode: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        };
        linkedTask: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            dueAt: Date | null;
        } | null;
        history: ({
            type: string;
            actor: {
                id: string;
                userCode: string;
                profile: {
                    fullName: string;
                    avatarUrl: string | null;
                } | null;
            };
            createdAt: Date;
            status: "PENDING_SOURCE_APPROVAL";
            reason?: undefined;
        } | {
            type: string;
            actor: {
                id: string;
                userCode: string;
                profile: {
                    fullName: string;
                    avatarUrl: string | null;
                } | null;
            } | null;
            createdAt: Date;
            status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
            reason: string | null;
        })[];
        task: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            taskCode: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            dueAt: Date | null;
        } | null;
        createdBy: {
            id: string;
            userCode: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        };
        decidedBy: {
            id: string;
            userCode: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        } | null;
        sourceDepartment: {
            id: string;
            code: string;
            name: string;
        };
        targetDepartment: {
            id: string;
            code: string;
            name: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        taskId: string | null;
        sourceDepartmentId: string;
        targetDepartmentId: string;
        requestCode: string;
        createdByUserId: string;
    }>;
    approveSource(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        taskId: string | null;
        sourceDepartmentId: string;
        targetDepartmentId: string;
        requestCode: string;
        createdByUserId: string;
    }>;
    rejectSource(id: string, dto: RejectCrossDepartmentRequestDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        taskId: string | null;
        sourceDepartmentId: string;
        targetDepartmentId: string;
        requestCode: string;
        createdByUserId: string;
    }>;
    acceptTarget(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        taskId: string | null;
        sourceDepartmentId: string;
        targetDepartmentId: string;
        requestCode: string;
        createdByUserId: string;
    }>;
    rejectTarget(id: string, dto: RejectCrossDepartmentRequestDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.CrossDepartmentRequestStatus;
        rejectionReason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        taskId: string | null;
        sourceDepartmentId: string;
        targetDepartmentId: string;
        requestCode: string;
        createdByUserId: string;
    }>;
    private decide;
    private canView;
}
