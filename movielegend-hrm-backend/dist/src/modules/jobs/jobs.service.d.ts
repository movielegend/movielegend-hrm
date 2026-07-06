import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class JobsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    list(): {
        jobName: "task-due-soon" | "task-overdue" | "contract-expiry" | "document-expiry" | "payroll-payslip" | "kpi-deadline" | "asset-return";
    }[];
    logs(): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.JobExecutionStatus;
        startedAt: Date;
        jobName: string;
        executionKey: string;
        finishedAt: Date | null;
        processedCount: number;
        successCount: number;
        failureCount: number;
        errorSummary: string | null;
    }[]>;
    run(jobName: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.JobExecutionStatus;
        startedAt: Date;
        jobName: string;
        executionKey: string;
        finishedAt: Date | null;
        processedCount: number;
        successCount: number;
        failureCount: number;
        errorSummary: string | null;
    }>;
    private execute;
    private contractExpiry;
    private documentExpiry;
}
