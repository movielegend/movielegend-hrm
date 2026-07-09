import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminDashboardService, EmployeeDashboardService, LeaderDashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly adminDashboard;
    private readonly leaderDashboard;
    private readonly employeeDashboard;
    constructor(adminDashboard: AdminDashboardService, leaderDashboard: LeaderDashboardService, employeeDashboard: EmployeeDashboardService);
    admin(): Promise<{
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
    leader(actor: AuthenticatedUser): Promise<{
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
    me(actor: AuthenticatedUser): Promise<{
        today: {
            shiftToday: ({
                shift: {
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    code: string;
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
                userId: string;
                departmentId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
                workDate: Date;
                shiftId: string;
                assignedByUserId: string | null;
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
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
                userId: string;
                title: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.ContractStatus;
                createdById: string;
                approvedAt: Date | null;
                approvedById: string | null;
                contractType: import("@prisma/client").$Enums.ContractType;
                contractTemplateId: string;
                contractTemplateVersionId: string;
                startDate: Date;
                endDate: Date | null;
                draftFileUrl: string | null;
                signedFileUrl: string | null;
                contractCode: string;
                baseSalarySnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                positionSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                departmentSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                employeeSignedAt: Date | null;
                companySignedAt: Date | null;
                effectiveAt: Date | null;
                terminatedAt: Date | null;
                terminationReason: string | null;
                employeeAcknowledgementStatus: import("@prisma/client").$Enums.AcknowledgementStatus;
                employeeAcknowledgedAt: Date | null;
                employeeAcknowledgementNote: string | null;
                employeeAcknowledgedByIp: string | null;
            } | null;
            signatureRequired: number;
            expiringContract: number;
        };
        kpi: {
            activeAssignment: {
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.EmployeeKpiAssignmentStatus;
                assignedById: string;
                assignedAt: Date;
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
