import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly jobs;
    constructor(jobs: JobsService);
    list(): {
        jobName: "task-due-soon" | "task-overdue" | "contract-expiry" | "document-expiry" | "payroll-payslip" | "kpi-deadline" | "asset-return";
    }[];
    logs(): import("@prisma/client").Prisma.PrismaPromise<{
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
}
