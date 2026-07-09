import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DateRangeReportQueryDto, EmployeeReportQueryDto, KpiReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    employees(query: EmployeeReportQueryDto, actor: AuthenticatedUser): Promise<{
        userCode: string;
        fullName: string | undefined;
        department: string;
        position: string | undefined;
        joinDate: Date | null | undefined;
        employmentStatus: import("@prisma/client").$Enums.EmploymentStatus | undefined;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
    }[]>;
    attendance(query: DateRangeReportQueryDto, actor: AuthenticatedUser): Promise<{
        scheduledDays: number;
        workedDays: number;
        absentDays: number;
        lateCount: number;
        lateMinutes: number;
        earlyLeaveCount: number;
        earlyLeaveMinutes: number;
        workedMinutes: number;
        approvedOvertimeMinutes: number;
        paidLeaveDays: number;
        unpaidLeaveDays: number;
    }[]>;
    tasks(query: DateRangeReportQueryDto, actor: AuthenticatedUser): Promise<{
        total: number;
        new: number;
        accepted: number;
        inProgress: number;
        waitingReview: number;
        completed: number;
        overdue: number;
        completionRate: number;
        averageCompletionTime: null;
    }[]>;
    payroll(query: DateRangeReportQueryDto, actor: AuthenticatedUser): Promise<{
        employeeCount: number;
        grossTotal: number;
        netTotal: number;
        bonusTotal: number;
        deductionTotal: number;
        otTotal: number;
        insuranceTotal: number;
        taxTotal: number;
    }[]>;
    warehouse(): Promise<{
        warehouses: number;
        lowStock: number;
        pendingIssues: number;
        transfers: number;
    }[]>;
    assets(): Promise<{
        total: number;
        assigned: number;
        inStock: number;
        maintenance: number;
        damaged: number;
        lost: number;
        disposed: number;
    }[]>;
    kpi(query: KpiReportQueryDto, actor: AuthenticatedUser): Promise<{
        assigned: number;
        finalized: number;
        averageScore: number;
        distribution: {};
    }[]>;
}
