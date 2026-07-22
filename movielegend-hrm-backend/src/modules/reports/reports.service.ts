import { Injectable } from '@nestjs/common';
import { AssetStatus, EmployeeKpiAssignmentStatus, PayrollStatus, TaskAssignmentStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { DateRangeReportQueryDto, EmployeeReportQueryDto, KpiReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly departmentScope: DepartmentScopeService,
  ) {}

  async scopedUserIds(actor: AuthenticatedUser, departmentId?: string): Promise<string[] | undefined> {
    if (actor.roles.includes('ADMIN') || actor.permissions.includes('report.payroll.detail')) return undefined;
    if (departmentId) this.departmentScope.assertDepartmentAccess(actor, departmentId);
    const visible = departmentId ? [departmentId] : this.departmentScope.visibleDepartmentIds(actor);
    if (!visible?.length) return [actor.userId];
    const members = await this.prisma.departmentMember.findMany({ where: { departmentId: { in: visible }, leftAt: null }, select: { userId: true } });
    return members.map((member) => member.userId);
  }
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ReportScopeService,
  ) {}

  async employees(query: EmployeeReportQueryDto, actor: AuthenticatedUser) {
    const userIds = await this.scope.scopedUserIds(actor, query.departmentId);
    const where = {
      id: userIds ? { in: userIds } : undefined,
      accountStatus: query.accountStatus,
      profile: {
        employmentStatus: query.employmentStatus,
        positionId: query.positionId,
        joinDate: { gte: query.joinDateFrom ? new Date(query.joinDateFrom) : undefined, lte: query.joinDateTo ? new Date(query.joinDateTo) : undefined },
        fullName: query.search ? { contains: query.search, mode: 'insensitive' as const } : undefined,
      },
      departmentLinks: query.departmentId ? { some: { departmentId: query.departmentId, leftAt: null } } : undefined,
    };
    const rows = await this.prisma.user.findMany({
      where,
      select: {
        userCode: true,
        accountStatus: true,
        profile: { select: { fullName: true, joinDate: true, employmentStatus: true, position: { select: { name: true } } } },
        departmentLinks: { where: { leftAt: null }, select: { department: { select: { name: true } } } },
      },
      skip: this.skip(query),
      take: this.limit(query),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      userCode: row.userCode,
      fullName: row.profile?.fullName,
      department: row.departmentLinks.map((link) => link.department.name).join(', '),
      position: row.profile?.position?.name,
      joinDate: row.profile?.joinDate,
      employmentStatus: row.profile?.employmentStatus,
      accountStatus: row.accountStatus,
    }));
  }

  async attendance(query: DateRangeReportQueryDto, actor: AuthenticatedUser) {
    const userIds = await this.scope.scopedUserIds(actor, query.departmentId);
    const range = this.range(query);
    const [scheduledDays, records, overtime, paidLeave, unpaidLeave] = await Promise.all([
      this.prisma.shiftAssignment.count({ where: { userId: userIds ? { in: userIds } : query.userId, workDate: range } }),
      this.prisma.attendanceRecord.findMany({ where: { userId: userIds ? { in: userIds } : query.userId, workDate: range } }),
      this.prisma.overtimeRequest.findMany({ where: { userId: userIds ? { in: userIds } : query.userId, status: 'APPROVED' }, select: { startAt: true, endAt: true } }),
      this.prisma.leaveRequest.count({ where: { userId: userIds ? { in: userIds } : query.userId, status: 'APPROVED', leaveType: { isPaid: true } } }),
      this.prisma.leaveRequest.count({ where: { userId: userIds ? { in: userIds } : query.userId, status: 'APPROVED', leaveType: { isPaid: false } } }),
    ]);
    const worked = records.filter((record) => record.checkInAt).length;
    return [{
      scheduledDays,
      workedDays: worked,
      absentDays: Math.max(0, scheduledDays - worked),
      lateCount: 0,
      lateMinutes: 0,
      earlyLeaveCount: 0,
      earlyLeaveMinutes: 0,
      workedMinutes: records.reduce((sum, record) => sum + (record.checkOutAt ? Math.max(0, Math.floor((record.checkOutAt.getTime() - record.checkInAt.getTime()) / 60_000)) : 0), 0),
      approvedOvertimeMinutes: overtime.reduce((sum, item) => sum + Math.max(0, Math.floor((item.endAt.getTime() - item.startAt.getTime()) / 60_000)), 0),
      paidLeaveDays: paidLeave,
      unpaidLeaveDays: unpaidLeave,
    }];
  }

  async tasks(query: DateRangeReportQueryDto, actor: AuthenticatedUser) {
    const userIds = await this.scope.scopedUserIds(actor, query.departmentId);
    const where = { userId: userIds ? { in: userIds } : query.userId };
    const [total, newly, accepted, inProgress, waitingReview, completed, overdue] = await Promise.all([
      this.prisma.taskAssignment.count({ where }),
      this.prisma.taskAssignment.count({ where: { ...where, status: TaskAssignmentStatus.NEW } }),
      this.prisma.taskAssignment.count({ where: { ...where, status: TaskAssignmentStatus.ACCEPTED } }),
      this.prisma.taskAssignment.count({ where: { ...where, status: TaskAssignmentStatus.IN_PROGRESS } }),
      this.prisma.taskAssignment.count({ where: { ...where, status: TaskAssignmentStatus.WAITING_REVIEW } }),
      this.prisma.taskAssignment.count({ where: { ...where, status: TaskAssignmentStatus.COMPLETED } }),
      this.prisma.taskAssignment.count({ where: { ...where, assignmentDueAt: { lt: new Date() }, status: { notIn: [TaskAssignmentStatus.COMPLETED, TaskAssignmentStatus.CANCELLED] } } }),
    ]);
    return [{ total, new: newly, accepted, inProgress, waitingReview, completed, overdue, completionRate: total ? completed / total : 0, averageCompletionTime: null }];
  }

  async payroll(_query: DateRangeReportQueryDto, actor: AuthenticatedUser) {
    if (!actor.permissions.includes('report.payroll.summary') && !actor.permissions.includes('report.payroll.detail')) {
      throw forbidden('PAYROLL_REPORT_FORBIDDEN', 'Cannot access payroll report');
    }
    const aggregate = await this.prisma.payroll.aggregate({
      where: { status: { in: [PayrollStatus.APPROVED, PayrollStatus.LOCKED] } },
      _count: { id: true },
      _sum: { grossSalary: true, netSalary: true, bonusAmount: true, deductionAmount: true, overtimeAmount: true, insuranceAmount: true, taxAmount: true },
    });
    return [{
      employeeCount: aggregate._count.id,
      grossTotal: Number(aggregate._sum.grossSalary ?? 0),
      netTotal: Number(aggregate._sum.netSalary ?? 0),
      bonusTotal: Number(aggregate._sum.bonusAmount ?? 0),
      deductionTotal: Number(aggregate._sum.deductionAmount ?? 0),
      otTotal: Number(aggregate._sum.overtimeAmount ?? 0),
      insuranceTotal: Number(aggregate._sum.insuranceAmount ?? 0),
      taxTotal: Number(aggregate._sum.taxAmount ?? 0),
    }];
  }

  async warehouse() {
    const [warehouses, pendingIssues, transfers] = await Promise.all([
      this.prisma.warehouse.count({ where: { deletedAt: null } }),
      this.prisma.materialIssue.count({ where: { status: { in: ['PENDING', 'ISSUING'] } } }),
      this.prisma.stockTransfer.count({ where: { status: { in: ['SHIPPED', 'IN_TRANSIT', 'COMPLETED'] } } }),
    ]);
    return [{ warehouses, lowStock: 0, pendingIssues, transfers }];
  }

  async assets() {
    const [total, inStock, outOfStock] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { assetStatus: AssetStatus.IN_STOCK } }),
      this.prisma.asset.count({ where: { assetStatus: AssetStatus.OUT_OF_STOCK } }),
    ]);
    return [{ total, inStock, outOfStock }];
  }

  async kpi(query: KpiReportQueryDto, actor: AuthenticatedUser) {
    const userIds = await this.scope.scopedUserIds(actor, query.departmentId);
    const aggregate = await this.prisma.employeeKpiAssignment.aggregate({
      where: { userId: userIds ? { in: userIds } : query.userId, kpiTemplateId: query.templateId },
      _count: { id: true },
      _avg: { finalScore: true },
    });
    const finalized = await this.prisma.employeeKpiAssignment.count({ where: { userId: userIds ? { in: userIds } : query.userId, kpiTemplateId: query.templateId, status: EmployeeKpiAssignmentStatus.FINALIZED } });
    return [{ assigned: aggregate._count.id, finalized, averageScore: Number(aggregate._avg.finalScore ?? 0), distribution: {} }];
  }

  private range(query: DateRangeReportQueryDto) {
    return {
      gte: query.fromDate ? new Date(query.fromDate) : undefined,
      lte: query.toDate ? new Date(query.toDate) : undefined,
    };
  }

  private skip(query: { page?: number; limit?: number }) {
    return ((query.page ?? 1) - 1) * this.limit(query);
  }

  private limit(query: { limit?: number }) {
    return Math.min(query.limit ?? 100, 5000);
  }
}
