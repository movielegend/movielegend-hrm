import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
export declare class DashboardAggregationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    todayRange(): {
        start: Date;
        end: Date;
    };
    countBy<T extends string>(items: T[], count: (value: T) => Promise<number>): Promise<Record<T, number>>;
}
export declare class AdminDashboardService {
    private readonly prisma;
    private readonly aggregation;
    constructor(prisma: PrismaService, aggregation: DashboardAggregationService);
    summary(): Promise<{
        employees: {
            total: number;
            active: number;
            pendingApproval: number;
            suspended: number;
            resigned: number;
            probation: number;
            official: number;
        };
        attendanceToday: {
            scheduled: number;
            checkedIn: number;
            checkedOut: number;
            absent: number;
            late: number;
            earlyLeave: number;
            onApprovedLeave: number;
        };
        tasks: {
            totalActive: number;
            new: number;
            inProgress: number;
            waitingReview: number;
            completed: number;
            overdue: number;
        };
        leave: {
            pending: number;
            approvedToday: number;
            employeesCurrentlyOnLeave: number;
        };
        warehouse: {
            totalWarehouses: number;
            lowStockMaterials: number;
            pendingMaterialIssues: number;
            transfersInTransit: number;
        };
        assets: {
            total: number;
            assigned: number;
            inStock: number;
            maintenance: number;
            damaged: number;
            lost: number;
        };
        payroll: {
            currentPeriodStatus: import("@prisma/client").$Enums.PayrollPeriodStatus;
            countCalculated: number;
            countApproved: number;
            countLocked: number;
        };
        contracts: {
            active: number;
            expiring30Days: number;
            waitingSignature: number;
            pendingApproval: number;
        };
        kpi: {
            activeAssignments: number;
            waitingSelfReview: number;
            waitingLeaderReview: number;
            finalized: number;
        };
    }>;
    private employeeSummary;
    private attendanceSummary;
    private taskSummary;
    private leaveSummary;
    private warehouseSummary;
    private assetSummary;
    private payrollSummary;
    private contractSummary;
    private kpiSummary;
}
export declare class LeaderDashboardService {
    private readonly prisma;
    private readonly scope;
    constructor(prisma: PrismaService, scope: DepartmentScopeService);
    summary(actor: AuthenticatedUser): Promise<{
        department: {
            activeEmployeeCount: number;
            absentToday: number;
            lateToday: number;
            onLeaveToday: number;
        };
        tasks: {
            active: number;
            overdue: number;
            waitingReview: number;
            completedThisPeriod: number;
        };
        shift: {
            scheduledToday: number;
            unassignedEmployees: number;
        };
        requests: {
            pendingLeave: number;
            pendingAttendanceAdjustment: number;
            pendingOt: number;
            pendingAccountApproval: number;
        };
        kpi: {
            awaitingLeaderReview: number;
            finalizedAverageScore: null;
        };
        assets: {
            assignedDepartmentAssets: number;
            damagedAssetReports: number;
        };
    }>;
}
export declare class EmployeeDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(actor: AuthenticatedUser): Promise<{
        today: {
            shiftToday: ({
                shift: {
                    id: string;
                    code: string;
                    name: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    startTime: string;
                    endTime: string;
                    breakMinutes: number;
                    checkInEarlyMinutes: number;
                    checkInLateMinutes: number;
                    checkOutEarlyMinutes: number;
                    checkOutLateMinutes: number;
                    isNightShift: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                assignedByUserId: string | null;
                status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
                departmentId: string;
                shiftId: string;
                workDate: Date;
            }) | null;
            checkInStatus: boolean;
            checkOutStatus: boolean;
            currentAttendanceStatus: import("@prisma/client").$Enums.AttendanceStatus | null;
        };
        tasks: {
            new: number;
            dueToday: number;
            overdue: number;
            waitingReview: number;
        };
        leave: {
            leaveBalances: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                year: number;
                leaveTypeId: string;
                balanceDays: import("@prisma/client/runtime/library").Decimal;
                usedDays: import("@prisma/client/runtime/library").Decimal;
            }[];
            pendingRequests: number;
        };
        payroll: {
            latestVisiblePayslipPeriod: string | null;
        };
        contract: {
            activeContract: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                createdById: string;
                contractType: import("@prisma/client").$Enums.ContractType;
                contractTemplateId: string;
                status: import("@prisma/client").$Enums.ContractStatus;
                contractCode: string;
                title: string;
                startDate: Date;
                endDate: Date | null;
                baseSalarySnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                positionSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                departmentSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                draftFileUrl: string | null;
                signedFileUrl: string | null;
                approvedAt: Date | null;
                employeeSignedAt: Date | null;
                companySignedAt: Date | null;
                effectiveAt: Date | null;
                terminatedAt: Date | null;
                terminationReason: string | null;
                employeeAcknowledgementStatus: import("@prisma/client").$Enums.AcknowledgementStatus;
                employeeAcknowledgedAt: Date | null;
                employeeAcknowledgementNote: string | null;
                employeeAcknowledgedByIp: string | null;
                contractTemplateVersionId: string;
                approvedById: string | null;
            } | null;
            signatureRequired: number;
            expiringContract: number;
        };
        kpi: {
            activeAssignment: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                assignedById: string;
                assignedAt: Date;
                status: import("@prisma/client").$Enums.EmployeeKpiAssignmentStatus;
                reviewedAt: Date | null;
                snapshot: import("@prisma/client/runtime/library").JsonValue | null;
                kpiTemplateId: string;
                periodStart: Date;
                periodEnd: Date;
                submittedAt: Date | null;
                finalizedAt: Date | null;
                finalScore: import("@prisma/client/runtime/library").Decimal | null;
            } | null;
            actionRequired: import("@prisma/client").$Enums.EmployeeKpiAssignmentStatus | null;
        };
        assets: {
            assignedAssetsCount: number;
            openIncidentReports: number;
        };
        notifications: {
            unreadCount: number;
        };
    }>;
}
