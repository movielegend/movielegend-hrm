import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { DateRangeReportQueryDto, EmployeeReportQueryDto, KpiReportQueryDto } from './dto/report-query.dto';
export declare class ReportScopeService {
    private readonly prisma;
    private readonly departmentScope;
    constructor(prisma: PrismaService, departmentScope: DepartmentScopeService);
    scopedUserIds(actor: AuthenticatedUser, departmentId?: string): Promise<string[] | undefined>;
}
export declare class ReportsService {
    private readonly prisma;
    private readonly scope;
    constructor(prisma: PrismaService, scope: ReportScopeService);
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
    payroll(_query: DateRangeReportQueryDto, actor: AuthenticatedUser): Promise<{
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
    private range;
    private skip;
    private limit;
}
