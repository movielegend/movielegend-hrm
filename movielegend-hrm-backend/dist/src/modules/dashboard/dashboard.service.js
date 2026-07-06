"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDashboardService = exports.LeaderDashboardService = exports.AdminDashboardService = exports.DashboardAggregationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
let DashboardAggregationService = class DashboardAggregationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    todayRange() {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    async countBy(items, count) {
        const entries = await Promise.all(items.map(async (item) => [item, await count(item)]));
        return Object.fromEntries(entries);
    }
};
exports.DashboardAggregationService = DashboardAggregationService;
exports.DashboardAggregationService = DashboardAggregationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardAggregationService);
let AdminDashboardService = class AdminDashboardService {
    prisma;
    aggregation;
    constructor(prisma, aggregation) {
        this.prisma = prisma;
        this.aggregation = aggregation;
    }
    async summary() {
        const { start, end } = this.aggregation.todayRange();
        const [employees, attendance, tasks, leave, warehouse, assets, payroll, contracts, kpi,] = await Promise.all([
            this.employeeSummary(),
            this.attendanceSummary(start, end),
            this.taskSummary(),
            this.leaveSummary(start, end),
            this.warehouseSummary(),
            this.assetSummary(),
            this.payrollSummary(),
            this.contractSummary(end),
            this.kpiSummary(),
        ]);
        return { employees, attendanceToday: attendance, tasks, leave, warehouse, assets, payroll, contracts, kpi };
    }
    async employeeSummary() {
        const [total, active, pendingApproval, suspended, resigned, probation, official] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.user.count({ where: { accountStatus: client_1.AccountStatus.ACTIVE, deletedAt: null } }),
            this.prisma.user.count({ where: { approvalStatus: 'PENDING', deletedAt: null } }),
            this.prisma.user.count({ where: { accountStatus: client_1.AccountStatus.SUSPENDED, deletedAt: null } }),
            this.prisma.user.count({ where: { accountStatus: client_1.AccountStatus.RESIGNED, deletedAt: null } }),
            this.prisma.employeeProfile.count({ where: { employmentStatus: client_1.EmploymentStatus.PROBATION } }),
            this.prisma.employeeProfile.count({ where: { employmentStatus: client_1.EmploymentStatus.OFFICIAL } }),
        ]);
        return { total, active, pendingApproval, suspended, resigned, probation, official };
    }
    async attendanceSummary(start, end) {
        const [scheduled, checkedIn, checkedOut, onApprovedLeave] = await Promise.all([
            this.prisma.shiftAssignment.count({ where: { workDate: { gte: start, lte: end } } }),
            this.prisma.attendanceRecord.count({ where: { workDate: { gte: start, lte: end } } }),
            this.prisma.attendanceRecord.count({ where: { workDate: { gte: start, lte: end }, checkOutAt: { not: null } } }),
            this.prisma.leaveRequest.count({ where: { status: client_1.LeaveRequestStatus.APPROVED, startDate: { lte: end }, endDate: { gte: start } } }),
        ]);
        return { scheduled, checkedIn, checkedOut, absent: Math.max(0, scheduled - checkedIn), late: 0, earlyLeave: 0, onApprovedLeave };
    }
    async taskSummary() {
        const now = new Date();
        const [totalActive, newly, inProgress, waitingReview, completed, overdue] = await Promise.all([
            this.prisma.task.count({ where: { deletedAt: null, status: { notIn: [client_1.TaskStatus.COMPLETED, client_1.TaskStatus.CANCELLED] } } }),
            this.prisma.task.count({ where: { deletedAt: null, status: client_1.TaskStatus.NEW } }),
            this.prisma.task.count({ where: { deletedAt: null, status: client_1.TaskStatus.IN_PROGRESS } }),
            this.prisma.task.count({ where: { deletedAt: null, status: client_1.TaskStatus.WAITING_REVIEW } }),
            this.prisma.task.count({ where: { deletedAt: null, status: client_1.TaskStatus.COMPLETED } }),
            this.prisma.task.count({ where: { deletedAt: null, dueAt: { lt: now }, status: { notIn: [client_1.TaskStatus.COMPLETED, client_1.TaskStatus.CANCELLED] } } }),
        ]);
        return { totalActive, new: newly, inProgress, waitingReview, completed, overdue };
    }
    async leaveSummary(start, end) {
        const [pending, approvedToday, employeesCurrentlyOnLeave] = await Promise.all([
            this.prisma.leaveRequest.count({ where: { status: client_1.LeaveRequestStatus.PENDING } }),
            this.prisma.leaveRequest.count({ where: { status: client_1.LeaveRequestStatus.APPROVED, decidedAt: { gte: start, lte: end } } }),
            this.prisma.leaveRequest.count({ where: { status: client_1.LeaveRequestStatus.APPROVED, startDate: { lte: end }, endDate: { gte: start } } }),
        ]);
        return { pending, approvedToday, employeesCurrentlyOnLeave };
    }
    async warehouseSummary() {
        const [totalWarehouses, pendingMaterialIssues, transfersInTransit] = await Promise.all([
            this.prisma.warehouse.count({ where: { deletedAt: null } }),
            this.prisma.materialIssue.count({ where: { status: { in: [client_1.MaterialIssueStatus.PENDING, client_1.MaterialIssueStatus.ISSUING] } } }),
            this.prisma.stockTransfer.count({ where: { status: { in: [client_1.StockTransferStatus.SHIPPED, client_1.StockTransferStatus.IN_TRANSIT] } } }),
        ]);
        return { totalWarehouses, lowStockMaterials: 0, pendingMaterialIssues, transfersInTransit };
    }
    async assetSummary() {
        const [total, assigned, inStock, maintenance, damaged, lost] = await Promise.all([
            this.prisma.asset.count({ where: { deletedAt: null } }),
            this.prisma.asset.count({ where: { assetStatus: client_1.AssetStatus.ASSIGNED, deletedAt: null } }),
            this.prisma.asset.count({ where: { assetStatus: client_1.AssetStatus.IN_STOCK, deletedAt: null } }),
            this.prisma.asset.count({ where: { assetStatus: client_1.AssetStatus.MAINTENANCE, deletedAt: null } }),
            this.prisma.asset.count({ where: { assetStatus: client_1.AssetStatus.DAMAGED, deletedAt: null } }),
            this.prisma.asset.count({ where: { assetStatus: client_1.AssetStatus.LOST, deletedAt: null } }),
        ]);
        return { total, assigned, inStock, maintenance, damaged, lost };
    }
    async payrollSummary() {
        const latest = await this.prisma.payrollPeriod.findFirst({ orderBy: { startDate: 'desc' } });
        const [countCalculated, countApproved, countLocked] = await Promise.all([
            this.prisma.payroll.count({ where: { payrollPeriodId: latest?.id, status: 'CALCULATED' } }),
            this.prisma.payroll.count({ where: { payrollPeriodId: latest?.id, status: 'APPROVED' } }),
            this.prisma.payroll.count({ where: { payrollPeriodId: latest?.id, status: 'LOCKED' } }),
        ]);
        return { currentPeriodStatus: latest?.status ?? client_1.PayrollPeriodStatus.DRAFT, countCalculated, countApproved, countLocked };
    }
    async contractSummary(end) {
        const in30 = new Date(end.getTime() + 30 * 86_400_000);
        const [active, expiring30Days, waitingSignature, pendingApproval] = await Promise.all([
            this.prisma.employeeContract.count({ where: { status: client_1.ContractStatus.ACTIVE } }),
            this.prisma.employeeContract.count({ where: { status: client_1.ContractStatus.ACTIVE, endDate: { gte: end, lte: in30 } } }),
            this.prisma.employeeContract.count({ where: { status: { in: [client_1.ContractStatus.WAITING_EMPLOYEE_SIGNATURE, client_1.ContractStatus.WAITING_COMPANY_SIGNATURE] } } }),
            this.prisma.employeeContract.count({ where: { status: client_1.ContractStatus.PENDING_INTERNAL_APPROVAL } }),
        ]);
        return { active, expiring30Days, waitingSignature, pendingApproval };
    }
    async kpiSummary() {
        const [activeAssignments, waitingSelfReview, waitingLeaderReview, finalized] = await Promise.all([
            this.prisma.employeeKpiAssignment.count({ where: { status: client_1.EmployeeKpiAssignmentStatus.ACTIVE } }),
            this.prisma.employeeKpiAssignment.count({ where: { status: client_1.EmployeeKpiAssignmentStatus.SELF_REVIEW } }),
            this.prisma.employeeKpiAssignment.count({ where: { status: client_1.EmployeeKpiAssignmentStatus.LEADER_REVIEW } }),
            this.prisma.employeeKpiAssignment.count({ where: { status: client_1.EmployeeKpiAssignmentStatus.FINALIZED } }),
        ]);
        return { activeAssignments, waitingSelfReview, waitingLeaderReview, finalized };
    }
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        DashboardAggregationService])
], AdminDashboardService);
let LeaderDashboardService = class LeaderDashboardService {
    prisma;
    scope;
    constructor(prisma, scope) {
        this.prisma = prisma;
        this.scope = scope;
    }
    async summary(actor) {
        const departmentIds = this.scope.visibleDepartmentIds(actor) ?? [];
        const { start, end } = new DashboardAggregationService(this.prisma).todayRange();
        const userIds = (await this.prisma.departmentMember.findMany({ where: { departmentId: { in: departmentIds }, leftAt: null }, select: { userId: true } })).map((item) => item.userId);
        const [activeEmployeeCount, absentToday, lateToday, onLeaveToday, activeTasks, overdueTasks, waitingReview, completedThisPeriod, scheduledToday, pendingLeave, pendingAdjustments, pendingOt, pendingApproval, awaitingLeaderReview, assignedDepartmentAssets, damagedAssetReports] = await Promise.all([
            this.prisma.user.count({ where: { id: { in: userIds }, accountStatus: client_1.AccountStatus.ACTIVE } }),
            this.prisma.shiftAssignment.count({ where: { userId: { in: userIds }, workDate: { gte: start, lte: end } } }),
            Promise.resolve(0),
            this.prisma.leaveRequest.count({ where: { userId: { in: userIds }, status: client_1.LeaveRequestStatus.APPROVED, startDate: { lte: end }, endDate: { gte: start } } }),
            this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, status: { notIn: [client_1.TaskAssignmentStatus.COMPLETED, client_1.TaskAssignmentStatus.CANCELLED] } } }),
            this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, assignmentDueAt: { lt: end }, status: { notIn: [client_1.TaskAssignmentStatus.COMPLETED, client_1.TaskAssignmentStatus.CANCELLED] } } }),
            this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, status: client_1.TaskAssignmentStatus.WAITING_REVIEW } }),
            this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, status: client_1.TaskAssignmentStatus.COMPLETED, completedAt: { gte: start, lte: end } } }),
            this.prisma.shiftAssignment.count({ where: { departmentId: { in: departmentIds }, workDate: { gte: start, lte: end } } }),
            this.prisma.leaveRequest.count({ where: { departmentId: { in: departmentIds }, status: client_1.LeaveRequestStatus.PENDING } }),
            this.prisma.attendanceAdjustment.count({ where: { departmentId: { in: departmentIds }, status: 'PENDING' } }),
            this.prisma.overtimeRequest.count({ where: { departmentId: { in: departmentIds }, status: 'PENDING' } }),
            this.prisma.userApprovalRequest.count({ where: { requestedDepartmentId: { in: departmentIds }, status: 'PENDING' } }),
            this.prisma.employeeKpiAssignment.count({ where: { userId: { in: userIds }, status: client_1.EmployeeKpiAssignmentStatus.LEADER_REVIEW } }),
            this.prisma.assetAssignment.count({ where: { assignedToDepartmentId: { in: departmentIds }, status: 'ACTIVE' } }),
            this.prisma.assetIncidentReport.count({ where: { asset: { assignments: { some: { assignedToDepartmentId: { in: departmentIds } } } }, status: { in: ['OPEN', 'INVESTIGATING'] } } }),
        ]);
        return {
            department: { activeEmployeeCount, absentToday, lateToday, onLeaveToday },
            tasks: { active: activeTasks, overdue: overdueTasks, waitingReview, completedThisPeriod },
            shift: { scheduledToday, unassignedEmployees: Math.max(0, activeEmployeeCount - scheduledToday) },
            requests: { pendingLeave, pendingAttendanceAdjustment: pendingAdjustments, pendingOt, pendingAccountApproval: pendingApproval },
            kpi: { awaitingLeaderReview, finalizedAverageScore: null },
            assets: { assignedDepartmentAssets, damagedAssetReports },
        };
    }
};
exports.LeaderDashboardService = LeaderDashboardService;
exports.LeaderDashboardService = LeaderDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService])
], LeaderDashboardService);
let EmployeeDashboardService = class EmployeeDashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary(actor) {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const [shiftToday, attendance, newTasks, dueToday, overdue, waitingReview, leaveBalances, pendingLeave, latestPayslip, activeContract, signatureRequired, expiringContract, activeKpi, assignedAssetsCount, openIncidentReports, unreadNotifications] = await Promise.all([
            this.prisma.shiftAssignment.findFirst({ where: { userId: actor.userId, workDate: { gte: start, lte: end } }, include: { shift: true } }),
            this.prisma.attendanceRecord.findFirst({ where: { userId: actor.userId, workDate: { gte: start, lte: end } } }),
            this.prisma.taskAssignment.count({ where: { userId: actor.userId, status: client_1.TaskAssignmentStatus.NEW } }),
            this.prisma.taskAssignment.count({ where: { userId: actor.userId, assignmentDueAt: { gte: start, lte: end } } }),
            this.prisma.taskAssignment.count({ where: { userId: actor.userId, assignmentDueAt: { lt: now }, status: { notIn: [client_1.TaskAssignmentStatus.COMPLETED, client_1.TaskAssignmentStatus.CANCELLED] } } }),
            this.prisma.taskAssignment.count({ where: { userId: actor.userId, status: client_1.TaskAssignmentStatus.WAITING_REVIEW } }),
            this.prisma.leaveBalance.findMany({ where: { userId: actor.userId } }),
            this.prisma.leaveRequest.count({ where: { userId: actor.userId, status: client_1.LeaveRequestStatus.PENDING } }),
            this.prisma.payroll.findFirst({ where: { userId: actor.userId, status: { in: ['APPROVED', 'LOCKED'] } }, include: { period: true }, orderBy: { createdAt: 'desc' } }),
            this.prisma.employeeContract.findFirst({ where: { userId: actor.userId, status: client_1.ContractStatus.ACTIVE }, orderBy: { startDate: 'desc' } }),
            this.prisma.employeeContract.count({ where: { userId: actor.userId, status: client_1.ContractStatus.WAITING_EMPLOYEE_SIGNATURE } }),
            this.prisma.employeeContract.count({ where: { userId: actor.userId, status: client_1.ContractStatus.ACTIVE, endDate: { gte: start, lte: new Date(start.getTime() + 30 * 86_400_000) } } }),
            this.prisma.employeeKpiAssignment.findFirst({ where: { userId: actor.userId, status: { in: [client_1.EmployeeKpiAssignmentStatus.ACTIVE, client_1.EmployeeKpiAssignmentStatus.LEADER_REVIEW, client_1.EmployeeKpiAssignmentStatus.FINAL_REVIEW] } }, orderBy: { periodStart: 'desc' } }),
            this.prisma.assetAssignment.count({ where: { assignedToUserId: actor.userId, status: 'ACTIVE' } }),
            this.prisma.assetIncidentReport.count({ where: { reportedById: actor.userId, status: { in: ['OPEN', 'INVESTIGATING'] } } }),
            this.prisma.notificationTarget.count({ where: { userId: actor.userId, readAt: null } }),
        ]);
        return {
            today: { shiftToday, checkInStatus: Boolean(attendance?.checkInAt), checkOutStatus: Boolean(attendance?.checkOutAt), currentAttendanceStatus: attendance?.status ?? null },
            tasks: { new: newTasks, dueToday, overdue, waitingReview },
            leave: { leaveBalances, pendingRequests: pendingLeave },
            payroll: { latestVisiblePayslipPeriod: latestPayslip?.period?.periodCode ?? null },
            contract: { activeContract, signatureRequired, expiringContract },
            kpi: { activeAssignment: activeKpi, actionRequired: activeKpi?.status ?? null },
            assets: { assignedAssetsCount, openIncidentReports },
            notifications: { unreadCount: unreadNotifications },
        };
    }
};
exports.EmployeeDashboardService = EmployeeDashboardService;
exports.EmployeeDashboardService = EmployeeDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeDashboardService);
//# sourceMappingURL=dashboard.service.js.map