import { Injectable } from '@nestjs/common';
import {
  AccountStatus,
  AssetStatus,
  ContractStatus,
  EmployeeKpiAssignmentStatus,
  EmploymentStatus,
  LeaveRequestStatus,
  MaterialIssueStatus,
  PayrollPeriodStatus,
  StockTransferStatus,
  TaskAssignmentStatus,
  TaskStatus,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';

@Injectable()
export class DashboardAggregationService {
  constructor(private readonly prisma: PrismaService) {}

  todayRange() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async countBy<T extends string>(items: T[], count: (value: T) => Promise<number>) {
    const entries = await Promise.all(items.map(async (item) => [item, await count(item)] as const));
    return Object.fromEntries(entries) as Record<T, number>;
  }
}

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregation: DashboardAggregationService,
  ) {}

  async summary() {
    const { start, end } = this.aggregation.todayRange();
    const [
      employees,
      attendance,
      tasks,
      leave,
      warehouse,
      assets,
      payroll,
      contracts,
      kpi,
    ] = await Promise.all([
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

  private async employeeSummary() {
    const [total, active, pendingApproval, suspended, resigned, probation, official] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { accountStatus: AccountStatus.ACTIVE, deletedAt: null } }),
      this.prisma.user.count({ where: { approvalStatus: 'PENDING', deletedAt: null } }),
      this.prisma.user.count({ where: { accountStatus: AccountStatus.SUSPENDED, deletedAt: null } }),
      this.prisma.user.count({ where: { accountStatus: AccountStatus.RESIGNED, deletedAt: null } }),
      this.prisma.employeeProfile.count({ where: { employmentStatus: EmploymentStatus.PROBATION } }),
      this.prisma.employeeProfile.count({ where: { employmentStatus: EmploymentStatus.OFFICIAL } }),
    ]);
    return { total, active, pendingApproval, suspended, resigned, probation, official };
  }

  private async attendanceSummary(start: Date, end: Date) {
    const [scheduled, checkedIn, checkedOut, onApprovedLeave] = await Promise.all([
      this.prisma.shiftAssignment.count({ where: { workDate: { gte: start, lte: end } } }),
      this.prisma.attendanceRecord.count({ where: { workDate: { gte: start, lte: end } } }),
      this.prisma.attendanceRecord.count({ where: { workDate: { gte: start, lte: end }, checkOutAt: { not: null } } }),
      this.prisma.leaveRequest.count({ where: { status: LeaveRequestStatus.APPROVED, startDate: { lte: end }, endDate: { gte: start } } }),
    ]);
    return { scheduled, checkedIn, checkedOut, absent: Math.max(0, scheduled - checkedIn), late: 0, earlyLeave: 0, onApprovedLeave };
  }

  private async taskSummary() {
    const now = new Date();
    const [totalActive, newly, inProgress, waitingReview, completed, overdue] = await Promise.all([
      this.prisma.task.count({ where: { deletedAt: null, status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] } } }),
      this.prisma.task.count({ where: { deletedAt: null, status: TaskStatus.NEW } }),
      this.prisma.task.count({ where: { deletedAt: null, status: TaskStatus.IN_PROGRESS } }),
      this.prisma.task.count({ where: { deletedAt: null, status: TaskStatus.WAITING_REVIEW } }),
      this.prisma.task.count({ where: { deletedAt: null, status: TaskStatus.COMPLETED } }),
      this.prisma.task.count({ where: { deletedAt: null, dueAt: { lt: now }, status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] } } }),
    ]);
    return { totalActive, new: newly, inProgress, waitingReview, completed, overdue };
  }

  private async leaveSummary(start: Date, end: Date) {
    const [pending, approvedToday, employeesCurrentlyOnLeave] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: LeaveRequestStatus.PENDING } }),
      this.prisma.leaveRequest.count({ where: { status: LeaveRequestStatus.APPROVED, decidedAt: { gte: start, lte: end } } }),
      this.prisma.leaveRequest.count({ where: { status: LeaveRequestStatus.APPROVED, startDate: { lte: end }, endDate: { gte: start } } }),
    ]);
    return { pending, approvedToday, employeesCurrentlyOnLeave };
  }

  private async warehouseSummary() {
    const [totalWarehouses, pendingMaterialIssues, transfersInTransit] = await Promise.all([
      this.prisma.warehouse.count({ where: { deletedAt: null } }),
      this.prisma.materialIssue.count({ where: { status: { in: [MaterialIssueStatus.PENDING, MaterialIssueStatus.ISSUING] } } }),
      this.prisma.stockTransfer.count({ where: { status: { in: [StockTransferStatus.SHIPPED, StockTransferStatus.IN_TRANSIT] } } }),
    ]);
    return { totalWarehouses, lowStockMaterials: 0, pendingMaterialIssues, transfersInTransit };
  }

  private async assetSummary() {
    const [total, assigned, inStock, maintenance, damaged, lost] = await Promise.all([
      this.prisma.asset.count({ where: { deletedAt: null } }),
      this.prisma.asset.count({ where: { assetStatus: AssetStatus.ASSIGNED, deletedAt: null } }),
      this.prisma.asset.count({ where: { assetStatus: AssetStatus.IN_STOCK, deletedAt: null } }),
      this.prisma.asset.count({ where: { assetStatus: AssetStatus.MAINTENANCE, deletedAt: null } }),
      this.prisma.asset.count({ where: { assetStatus: AssetStatus.DAMAGED, deletedAt: null } }),
      this.prisma.asset.count({ where: { assetStatus: AssetStatus.LOST, deletedAt: null } }),
    ]);
    return { total, assigned, inStock, maintenance, damaged, lost };
  }

  private async payrollSummary() {
    const latest = await this.prisma.payrollPeriod.findFirst({ orderBy: { startDate: 'desc' } });
    const [countCalculated, countApproved, countLocked] = await Promise.all([
      this.prisma.payroll.count({ where: { payrollPeriodId: latest?.id, status: 'CALCULATED' } }),
      this.prisma.payroll.count({ where: { payrollPeriodId: latest?.id, status: 'APPROVED' } }),
      this.prisma.payroll.count({ where: { payrollPeriodId: latest?.id, status: 'LOCKED' } }),
    ]);
    return { currentPeriodStatus: latest?.status ?? PayrollPeriodStatus.DRAFT, countCalculated, countApproved, countLocked };
  }

  private async contractSummary(end: Date) {
    const in30 = new Date(end.getTime() + 30 * 86_400_000);
    const [active, expiring30Days, waitingSignature, pendingApproval] = await Promise.all([
      this.prisma.employeeContract.count({ where: { status: ContractStatus.ACTIVE } }),
      this.prisma.employeeContract.count({ where: { status: ContractStatus.ACTIVE, endDate: { gte: end, lte: in30 } } }),
      this.prisma.employeeContract.count({ where: { status: { in: [ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.WAITING_COMPANY_SIGNATURE] } } }),
      this.prisma.employeeContract.count({ where: { status: ContractStatus.PENDING_INTERNAL_APPROVAL } }),
    ]);
    return { active, expiring30Days, waitingSignature, pendingApproval };
  }

  private async kpiSummary() {
    const [activeAssignments, waitingSelfReview, waitingLeaderReview, finalized] = await Promise.all([
      this.prisma.employeeKpiAssignment.count({ where: { status: EmployeeKpiAssignmentStatus.ACTIVE } }),
      this.prisma.employeeKpiAssignment.count({ where: { status: EmployeeKpiAssignmentStatus.SELF_REVIEW } }),
      this.prisma.employeeKpiAssignment.count({ where: { status: EmployeeKpiAssignmentStatus.LEADER_REVIEW } }),
      this.prisma.employeeKpiAssignment.count({ where: { status: EmployeeKpiAssignmentStatus.FINALIZED } }),
    ]);
    return { activeAssignments, waitingSelfReview, waitingLeaderReview, finalized };
  }

  async activities() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        actor: {
          select: {
            profile: {
              select: {
                fullName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
    
    return logs.map(log => {
      const name = log.actor?.profile?.fullName || 'Người dùng ẩn danh';
      let title = `${name} đã thực hiện một hành động`;
      let icon = 'history';
      let color = '#6B7280';
      const meta = log.metadata as any || {};
      
      const actionUpper = log.action.toUpperCase();
      
      // Enhanced translation mapping
      if (actionUpper.includes('CREATE') || actionUpper.includes('NEW')) {
        let entityName = log.entityType;
        if (entityName === 'Task' || actionUpper.includes('TASK')) entityName = 'công việc';
        if (entityName === 'LeaveRequest' || actionUpper.includes('LEAVE')) entityName = 'đơn xin nghỉ phép';
        if (entityName === 'OvertimeRequest' || actionUpper.includes('OVERTIME')) entityName = 'đơn làm thêm giờ';
        
        title = `${name} đã tạo ${entityName}`;
        if (meta.taskCode) title += ` (${meta.taskCode})`;
        icon = 'plus-circle-outline';
        color = '#3B82F6';
      } else if (actionUpper.includes('APPROVE')) {
        title = `${name} đã duyệt ${log.entityType}`;
        icon = 'check-circle-outline';
        color = '#10B981';
      } else if (actionUpper.includes('REJECT')) {
        title = `${name} đã từ chối ${log.entityType}`;
        if (meta.reason) title += ` (Lý do: ${meta.reason})`;
        icon = 'close-circle-outline';
        color = '#EF4444';
      } else if (actionUpper.includes('CANCEL')) {
        title = `${name} đã hủy ${log.entityType}`;
        icon = 'cancel';
        color = '#F59E0B';
      } else if (actionUpper.includes('COMPLETE')) {
        title = `${name} đã hoàn thành ${log.entityType === 'Task' ? 'công việc' : log.entityType}`;
        icon = 'check-decagram-outline';
        color = '#10B981';
      } else if (actionUpper.includes('ASSIGN')) {
        title = `${name} đã phân công ${log.entityType}`;
        icon = 'account-arrow-right-outline';
        color = '#8B5CF6';
      } else if (actionUpper.includes('UPDATE')) {
        title = `${name} đã cập nhật ${log.entityType}`;
        icon = 'pencil-outline';
        color = '#F59E0B';
      }
      
      return {
        id: log.id,
        title,
        time: log.createdAt.toISOString(),
        icon,
        color,
        rawAction: log.action,
        entityType: log.entityType
      };
    });
  }
}

@Injectable()
export class LeaderDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
  ) {}

  async summary(actor: AuthenticatedUser) {
    const departmentIds = this.scope.visibleDepartmentIds(actor) ?? [];
    const { start, end } = new DashboardAggregationService(this.prisma).todayRange();
    const userIds = (await this.prisma.departmentMember.findMany({ where: { departmentId: { in: departmentIds }, leftAt: null }, select: { userId: true } })).map((item) => item.userId);
    const [activeEmployeeCount, absentToday, lateToday, onLeaveToday, activeTasks, overdueTasks, waitingReview, completedThisPeriod, scheduledToday, pendingLeave, pendingAdjustments, pendingOt, pendingApproval, awaitingLeaderReview, assignedDepartmentAssets, damagedAssetReports] =
      await Promise.all([
        this.prisma.user.count({ where: { id: { in: userIds }, accountStatus: AccountStatus.ACTIVE } }),
        this.prisma.shiftAssignment.count({ where: { userId: { in: userIds }, workDate: { gte: start, lte: end } } }),
        Promise.resolve(0),
        this.prisma.leaveRequest.count({ where: { userId: { in: userIds }, status: LeaveRequestStatus.APPROVED, startDate: { lte: end }, endDate: { gte: start } } }),
        this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, status: { notIn: [TaskAssignmentStatus.COMPLETED, TaskAssignmentStatus.CANCELLED] } } }),
        this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, assignmentDueAt: { lt: end }, status: { notIn: [TaskAssignmentStatus.COMPLETED, TaskAssignmentStatus.CANCELLED] } } }),
        this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, status: TaskAssignmentStatus.WAITING_REVIEW } }),
        this.prisma.taskAssignment.count({ where: { userId: { in: userIds }, status: TaskAssignmentStatus.COMPLETED, completedAt: { gte: start, lte: end } } }),
        this.prisma.shiftAssignment.count({ where: { departmentId: { in: departmentIds }, workDate: { gte: start, lte: end } } }),
        this.prisma.leaveRequest.count({ where: { departmentId: { in: departmentIds }, status: LeaveRequestStatus.PENDING } }),
        this.prisma.attendanceAdjustment.count({ where: { departmentId: { in: departmentIds }, status: 'PENDING' } }),
        this.prisma.overtimeRequest.count({ where: { departmentId: { in: departmentIds }, status: 'PENDING' } }),
        this.prisma.userApprovalRequest.count({ where: { requestedDepartmentId: { in: departmentIds }, status: 'PENDING' } }),
        this.prisma.employeeKpiAssignment.count({ where: { userId: { in: userIds }, status: EmployeeKpiAssignmentStatus.LEADER_REVIEW } }),
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

  async activities(actor: AuthenticatedUser) {
    const departmentIds = this.scope.visibleDepartmentIds(actor) ?? [];
    
    // Find all users in these departments
    const members = await this.prisma.departmentMember.findMany({ 
      where: { departmentId: { in: departmentIds }, leftAt: null }, 
      select: { userId: true } 
    });
    
    const userIds = members.map(m => m.userId);
    
    if (userIds.length === 0) return [];
    
    // Fetch recent audit logs for these users
    const logs = await this.prisma.auditLog.findMany({
      where: {
        actorUserId: { in: userIds }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        actor: {
          select: {
            profile: {
              select: {
                fullName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
    
    return logs.map(log => {
      const name = log.actor?.profile?.fullName || 'Người dùng ẩn danh';
      let title = `${name} đã thực hiện một hành động`;
      let icon = 'history';
      let color = '#6B7280';
      const meta = log.metadata as any || {};
      
      const actionUpper = log.action.toUpperCase();
      
      // Enhanced translation mapping
      if (actionUpper.includes('CREATE') || actionUpper.includes('NEW')) {
        let entityName = log.entityType;
        if (entityName === 'Task' || actionUpper.includes('TASK')) entityName = 'công việc';
        if (entityName === 'LeaveRequest' || actionUpper.includes('LEAVE')) entityName = 'đơn xin nghỉ phép';
        if (entityName === 'OvertimeRequest' || actionUpper.includes('OVERTIME')) entityName = 'đơn làm thêm giờ';
        
        title = `${name} đã tạo ${entityName}`;
        if (meta.taskCode) title += ` (${meta.taskCode})`;
        icon = 'plus-circle-outline';
        color = '#3B82F6';
      } else if (actionUpper.includes('APPROVE')) {
        title = `${name} đã duyệt ${log.entityType}`;
        icon = 'check-circle-outline';
        color = '#10B981';
      } else if (actionUpper.includes('REJECT')) {
        title = `${name} đã từ chối ${log.entityType}`;
        if (meta.reason) title += ` (Lý do: ${meta.reason})`;
        icon = 'close-circle-outline';
        color = '#EF4444';
      } else if (actionUpper.includes('CANCEL')) {
        title = `${name} đã hủy ${log.entityType}`;
        icon = 'cancel';
        color = '#F59E0B';
      } else if (actionUpper.includes('COMPLETE')) {
        title = `${name} đã hoàn thành ${log.entityType === 'Task' ? 'công việc' : log.entityType}`;
        icon = 'check-decagram-outline';
        color = '#10B981';
      } else if (actionUpper.includes('ASSIGN')) {
        title = `${name} đã phân công ${log.entityType}`;
        icon = 'account-arrow-right-outline';
        color = '#8B5CF6';
      } else if (actionUpper.includes('UPDATE')) {
        title = `${name} đã cập nhật ${log.entityType}`;
        icon = 'pencil-outline';
        color = '#F59E0B';
      }
      
      return {
        id: log.id,
        title,
        time: log.createdAt.toISOString(),
        icon,
        color,
        rawAction: log.action,
        entityType: log.entityType
      };
    });
  }
}

@Injectable()
export class EmployeeDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(actor: AuthenticatedUser) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const [shiftToday, attendance, newTasks, dueToday, overdue, waitingReview, leaveBalances, pendingLeave, latestPayslip, activeContract, signatureRequired, expiringContract, activeKpi, assignedAssetsCount, openIncidentReports, unreadNotifications] =
      await Promise.all([
        this.prisma.shiftAssignment.findFirst({ where: { userId: actor.userId, workDate: { gte: start, lte: end } }, include: { shift: true } }),
        this.prisma.attendanceRecord.findFirst({ where: { userId: actor.userId, workDate: { gte: start, lte: end } } }),
        this.prisma.taskAssignment.count({ where: { userId: actor.userId, status: TaskAssignmentStatus.NEW } }),
        this.prisma.taskAssignment.count({ where: { userId: actor.userId, assignmentDueAt: { gte: start, lte: end } } }),
        this.prisma.taskAssignment.count({ where: { userId: actor.userId, assignmentDueAt: { lt: now }, status: { notIn: [TaskAssignmentStatus.COMPLETED, TaskAssignmentStatus.CANCELLED] } } }),
        this.prisma.taskAssignment.count({ where: { userId: actor.userId, status: TaskAssignmentStatus.WAITING_REVIEW } }),
        this.prisma.leaveBalance.findMany({ where: { userId: actor.userId } }),
        this.prisma.leaveRequest.count({ where: { userId: actor.userId, status: LeaveRequestStatus.PENDING } }),
        this.prisma.payroll.findFirst({ where: { userId: actor.userId, status: { in: ['APPROVED', 'LOCKED'] } }, include: { period: true }, orderBy: { createdAt: 'desc' } }),
        this.prisma.employeeContract.findFirst({ where: { userId: actor.userId, status: ContractStatus.ACTIVE }, orderBy: { startDate: 'desc' } }),
        this.prisma.employeeContract.count({ where: { userId: actor.userId, status: ContractStatus.WAITING_EMPLOYEE_SIGNATURE } }),
        this.prisma.employeeContract.count({ where: { userId: actor.userId, status: ContractStatus.ACTIVE, endDate: { gte: start, lte: new Date(start.getTime() + 30 * 86_400_000) } } }),
        this.prisma.employeeKpiAssignment.findFirst({ where: { userId: actor.userId, status: { in: [EmployeeKpiAssignmentStatus.ACTIVE, EmployeeKpiAssignmentStatus.LEADER_REVIEW, EmployeeKpiAssignmentStatus.FINAL_REVIEW] } }, orderBy: { periodStart: 'desc' } }),
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
}
