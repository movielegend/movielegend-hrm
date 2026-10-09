import { Injectable } from '@nestjs/common';
import {
  AccountStatus,
  EmployeeBonusStatus,
  EmployeeDeductionStatus,
  EmployeeRequestStatus,
  EmployeeRequestType,
  LeaveRequestStatus,
  NotificationType,
  OvertimeRequestStatus,
  OtReportStatus,
  PayrollItemType,
  PayrollPeriodStatus,
  PayrollStatus,
  Prisma,
  SalaryComponentType,
  SalaryType,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { randomUUID } from 'crypto';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import {
  CreatePayrollPeriodDto,
  ImportPayrollDto,
  MyPayslipQueryDto,
  CompanyPayslipsQueryDto,
  UploadPayslipImageDto,
  UploadDepartmentPayslipBatchDto,
  AssignDepartmentPayslipImageDto,
  UnassignDepartmentPayslipImageDto,
  GetDepartmentBatchQueryDto,
} from './dto/payroll.dto';
import { PayrollPolicyService } from './payroll-policy.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PayrollPolicyService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
    private readonly scope: DepartmentScopeService,
  ) {}

  createPeriod(dto: CreatePayrollPeriodDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const periodCode = await this.prisma.nextSequenceCode(tx, 'payroll_period_code_seq', 'PAY');
      const period = await tx.payrollPeriod.create({
        data: {
          periodCode,
          companyId: dto.companyId,
          month: dto.month,
          year: dto.year,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          createdById: actor.userId,
        },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'PAYROLL_PERIOD_CREATED', entityType: 'PayrollPeriod', entityId: period.id },
      });
      return period;
    });
  }

  findPeriods() {
    return this.prisma.payrollPeriod.findMany({ include: { company: true }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
  }

  async findPeriod(id: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id }, include: { payrolls: true } });
    if (!period) throw notFound('PAYROLL_PERIOD_NOT_FOUND', 'Payroll period not found');
    return period;
  }

  async calculatePeriod(id: string, actor: AuthenticatedUser, recalculate = false) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) throw notFound('PAYROLL_PERIOD_NOT_FOUND', 'Payroll period not found');
    if (period.status === PayrollPeriodStatus.LOCKED) throw conflict('PAYROLL_PERIOD_LOCKED', 'Locked payroll cannot be recalculated');
    const allowed: PayrollPeriodStatus[] = recalculate
      ? [PayrollPeriodStatus.DRAFT, PayrollPeriodStatus.CALCULATED]
      : [PayrollPeriodStatus.DRAFT, PayrollPeriodStatus.CALCULATED];
    if (!allowed.includes(period.status)) throw conflict('PAYROLL_PERIOD_NOT_CALCULABLE', 'Payroll period cannot be calculated now');
    const originalStatus = period.status;
    const claimed = await this.prisma.payrollPeriod.updateMany({
      where: { id, status: { in: allowed } },
      data: { status: PayrollPeriodStatus.CALCULATING },
    });
    if (claimed.count !== 1) throw conflict('PAYROLL_CALCULATION_IN_PROGRESS', 'Payroll period is being calculated');

    try {
      const employees = await this.prisma.user.findMany({
        where: { isActive: true, accountStatus: AccountStatus.ACTIVE, deletedAt: null },
        select: { id: true },
      });
      const chunkSize = 20;
      for (let i = 0; i < employees.length; i += chunkSize) {
        const chunk = employees.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((employee) => this.calculateEmployeePayroll(id, employee.id, actor.userId)),
        );
      }
      const updated = await this.prisma.payrollPeriod.update({
        where: { id },
        data: { status: PayrollPeriodStatus.CALCULATED, calculatedAt: new Date() },
      });
      await this.prisma.auditLog.create({
        data: { actorUserId: actor.userId, action: recalculate ? 'PAYROLL_RECALCULATED' : 'PAYROLL_CALCULATED', entityType: 'PayrollPeriod', entityId: id },
      });
      this.realtime.emitToRoom('payroll:admin', 'payroll:period-updated', { id, status: updated.status });
      return updated;
    } catch (error) {
      await this.prisma.payrollPeriod.update({ where: { id }, data: { status: originalStatus } });
      throw error;
    }
  }

  recalculatePeriod(id: string, actor: AuthenticatedUser) {
    return this.calculatePeriod(id, actor, true);
  }

  async submitReview(id: string, actor: AuthenticatedUser) {
    const period = await this.findPeriod(id);
    this.policy.assertPeriodTransition(period.status, PayrollPeriodStatus.UNDER_REVIEW);
    const updated = await this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: PayrollPeriodStatus.UNDER_REVIEW, reviewedAt: new Date(), reviewedById: actor.userId },
    });
    this.realtime.emitToRoom('payroll:admin', 'payroll:period-updated', { id, status: updated.status });
    return updated;
  }

  async approve(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payrollPeriod.updateMany({
        where: { id, status: PayrollPeriodStatus.UNDER_REVIEW },
        data: { status: PayrollPeriodStatus.APPROVED, approvedAt: new Date(), approvedById: actor.userId },
      });
      if (updated.count !== 1) throw conflict('PAYROLL_PERIOD_NOT_UNDER_REVIEW', 'Payroll period must be under review before approval');
      await tx.payroll.updateMany({ where: { payrollPeriodId: id }, data: { status: PayrollStatus.APPROVED } });
      const payrolls = await tx.payroll.findMany({ where: { payrollPeriodId: id }, select: { userId: true } });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'PAYROLL_APPROVED', entityType: 'PayrollPeriod', entityId: id } });
      const notify = await this.notifications.createForUsers(tx, payrolls.map((item) => item.userId), {
        type: NotificationType.PAYROLL_APPROVED,
        title: 'Payroll approved',
        body: 'Your payslip is available for review',
        metadata: { payrollPeriodId: id },
      });
      const period = await tx.payrollPeriod.findUniqueOrThrow({ where: { id } });
      return { period, notify, payrolls };
    });
    this.notifications.emitCreated(payload.notify);
    for (const payroll of payload.payrolls) {
      this.realtime.emitToUser(payroll.userId, 'payroll:payslip-available', { payrollPeriodId: id });
    }
    return payload.period;
  }

  async lock(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const period = await tx.payrollPeriod.findUnique({ where: { id } });
      if (!period) throw notFound('PAYROLL_PERIOD_NOT_FOUND', 'Payroll period not found');
      if (period.status !== PayrollPeriodStatus.APPROVED) throw conflict('PAYROLL_PERIOD_NOT_APPROVED', 'Payroll period must be approved before lock');
      await tx.payroll.updateMany({ where: { payrollPeriodId: id }, data: { status: PayrollStatus.LOCKED } });
      const updated = await tx.payrollPeriod.updateMany({
        where: { id, status: PayrollPeriodStatus.APPROVED },
        data: { status: PayrollPeriodStatus.LOCKED, lockedAt: new Date(), lockedById: actor.userId },
      });
      if (updated.count !== 1) throw conflict('PAYROLL_PERIOD_NOT_APPROVED', 'Payroll period must be approved before lock');
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'PAYROLL_LOCKED', entityType: 'PayrollPeriod', entityId: id } });
      return tx.payrollPeriod.findUniqueOrThrow({ where: { id } });
    });
    this.realtime.emitToRoom('payroll:admin', 'payroll:period-updated', { id, status: payload.status });
    return payload;
  }

  async findPeriodPayrolls(periodId: string, actor?: AuthenticatedUser) {
    let visibleDepartmentIds: string[] | null = null;
    if (actor) {
      const isRegionAdmin = this.scope.isRegionAdmin(actor);
      visibleDepartmentIds = isRegionAdmin
        ? ((await this.scope.getVisibleDepartmentIds(actor)) ?? [])
        : await this.scope.getVisibleDepartmentIds(actor);
    }
    return this.prisma.payroll.findMany({
      where: {
        payrollPeriodId: periodId,
        ...(visibleDepartmentIds !== null
          ? {
              user: {
                departmentLinks: {
                  some: {
                    departmentId: {
                      in: visibleDepartmentIds.length > 0 ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'],
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: { user: { select: { id: true, userCode: true, email: true, phone: true, profile: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPayroll(id: string) {
    const payroll = await this.prisma.payroll.findUnique({ where: { id }, include: { period: true, items: true, snapshot: true } });
    if (!payroll) throw notFound('PAYROLL_NOT_FOUND', 'Payroll not found');
    return payroll;
  }

  myPayrolls(actor: AuthenticatedUser) {
    return this.prisma.payroll.findMany({
      where: { userId: actor.userId, status: { in: [PayrollStatus.APPROVED, PayrollStatus.LOCKED] } },
      include: { period: true, items: true },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async myPayroll(id: string, actor: AuthenticatedUser) {
    const payroll = await this.prisma.payroll.findUnique({ where: { id }, include: { period: true, items: true, snapshot: true } });
    if (!payroll) throw notFound('PAYROLL_NOT_FOUND', 'Payroll not found');
    if (payroll.userId !== actor.userId) throw forbidden('PAYROLL_OWNER_ONLY', 'Cannot view another employee payroll');
    const visibleStatuses: PayrollStatus[] = [PayrollStatus.APPROVED, PayrollStatus.LOCKED];
    if (!visibleStatuses.includes(payroll.status)) {
      throw forbidden('PAYROLL_NOT_VISIBLE', 'Payroll is not visible yet');
    }
    return payroll;
  }

  async getMyPayslip(actor: AuthenticatedUser, query: MyPayslipQueryDto) {
    const now = new Date();
    const month = query.month ? Number(query.month) : now.getMonth() + 1;
    const year = query.year ? Number(query.year) : now.getFullYear();

    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      include: {
        profile: { include: { position: true } },
        departmentLinks: { include: { department: true } },
      },
    });

    const payroll = await this.prisma.payroll.findFirst({
      where: {
        userId: actor.userId,
        period: { month, year },
      },
      include: {
        period: true,
        items: true,
      },
      orderBy: { calculatedAt: 'desc' },
    });

    // Lấy ảnh phiếu lương chốt chính thức từ Leader Kế toán (ưu tiên ảnh riêng của nhân sự này)
    const specificImageLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'PAYROLL_OFFICIAL_IMAGE',
        entityId: actor.userId,
      },
      orderBy: { createdAt: 'desc' },
    });
    const imageLog = specificImageLog || await this.prisma.auditLog.findFirst({
      where: {
        action: 'PAYROLL_OFFICIAL_IMAGE',
        entityId: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    let finalOfficialImageUrl: string | null = null;
    if (imageLog?.metadata && typeof imageLog.metadata === 'object') {
      const meta = imageLog.metadata as any;
      if (meta.month === month && meta.year === year) {
        finalOfficialImageUrl = meta.imageUrl || null;
      }
    }

    // Tính toán hạn mức Tạm ứng lương (Tối đa 50% lương) & Lấy danh sách đơn tạm ứng trong tháng
    const salaryProfile = await this.prisma.salaryProfile.findFirst({
      where: { userId: actor.userId },
      orderBy: { effectiveFrom: 'desc' },
    });
    const userBaseSalary = payroll ? Number(payroll.baseSalary) : (salaryProfile?.baseSalary ? Number(salaryProfile.baseSalary) : 0);
    const maxAdvanceLimit = Math.floor(userBaseSalary * 0.5);

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const advanceRequests = await this.prisma.employeeRequest.findMany({
      where: {
        userId: actor.userId,
        type: EmployeeRequestType.ADVANCE,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentMonthAdvancedAmount = advanceRequests
      .filter((r) => r.status === EmployeeRequestStatus.PENDING || r.status === EmployeeRequestStatus.APPROVED)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const remainingAdvanceLimit = Math.max(0, maxAdvanceLimit - currentMonthAdvancedAmount);

    const advanceSummary = {
      baseSalary: userBaseSalary,
      maxAdvanceLimit,
      currentMonthAdvancedAmount,
      remainingAdvanceLimit,
      requests: advanceRequests.map((r) => {
        const meta = (typeof r.attachmentMetadata === 'object' && r.attachmentMetadata !== null) ? (r.attachmentMetadata as any) : {};
        return {
          id: r.id,
          title: r.title,
          content: r.content,
          amount: Number(r.amount || 0),
          status: r.status,
          stage: meta.stage || (r.status === 'APPROVED' ? 'DISBURSED' : 'PENDING_LEADER'),
          createdAt: r.createdAt.toISOString(),
          bankName: meta.bankName || meta.bankAccountName,
          bankAccount: meta.bankAccount || meta.accountNumber,
          accountHolder: meta.accountHolder || meta.accountHolderName,
          disbursementProofUrl: meta.disbursementProofUrl || null,
          approvalSteps: meta.approvalSteps || [],
        };
      }),
    };

    if (!payroll) {
      return {
        month,
        year,
        hasData: false,
        finalOfficialImageUrl,
        advanceSummary,
        employee: {
          fullName: user?.profile?.fullName || 'Nhân viên',
          userCode: user?.userCode || '---',
          departmentName: user?.departmentLinks?.[0]?.department?.name || '---',
          positionName: user?.profile?.position?.name || 'Nhân viên',
        },
        baseSalary: userBaseSalary,
        actualSalary: userBaseSalary,
        standardWorkingDays: 26,
        actualWorkingDays: 0,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        overtimeHours: 0,
        overtimeAmount: 0,
        allowanceAmount: 0,
        bonusAmount: 0,
        deductionAmount: 0,
        insuranceAmount: 0,
        taxAmount: 0,
        advanceAmount: currentMonthAdvancedAmount,
        latePenaltyAmount: 0,
        grossSalary: userBaseSalary,
        netSalary: userBaseSalary,
        status: 'UNAVAILABLE',
        items: [],
      };
    }

    const overtimeHours = Number((payroll.overtimeMinutes / 60).toFixed(1));

    // Phân loại items
    const allowanceItems = payroll.items.filter((i) => i.itemType === PayrollItemType.ALLOWANCE);
    const bonusItems = payroll.items.filter((i) => i.itemType === PayrollItemType.BONUS);
    const deductionItems = payroll.items.filter(
      (i) => i.itemType === PayrollItemType.DEDUCTION || i.itemType === PayrollItemType.INSURANCE || i.itemType === PayrollItemType.TAX,
    );

    return {
      id: payroll.id,
      month,
      year,
      hasData: true,
      finalOfficialImageUrl,
      advanceSummary,
      periodCode: payroll.period.periodCode,
      status: payroll.status,
      calculatedAt: payroll.calculatedAt,
      employeeAcknowledgedAt: payroll.employeeAcknowledgedAt,
      employee: {
        fullName: user?.profile?.fullName || 'Nhân viên',
        userCode: user?.userCode || '---',
        departmentName: user?.departmentLinks?.[0]?.department?.name || '---',
        positionName: user?.profile?.position?.name || 'Nhân viên',
      },
      baseSalary: Number(payroll.baseSalary),
      actualSalary: Number(payroll.grossSalary) || Number(payroll.baseSalary),
      standardWorkingDays: Number(payroll.standardWorkingDays),
      actualWorkingDays: Number(payroll.actualWorkingDays),
      paidLeaveDays: Number(payroll.paidLeaveDays),
      unpaidLeaveDays: Number(payroll.unpaidLeaveDays),
      overtimeHours,
      overtimeAmount: Number(payroll.overtimeAmount),
      allowanceAmount: Number(payroll.allowanceAmount),
      bonusAmount: Number(payroll.bonusAmount),
      deductionAmount: Number(payroll.deductionAmount),
      insuranceAmount: Number(payroll.insuranceAmount),
      taxAmount: Number(payroll.taxAmount),
      advanceAmount: currentMonthAdvancedAmount,
      grossSalary: Number(payroll.grossSalary),
      netSalary: Number(payroll.netSalary),
      allowanceItems: allowanceItems.map((i) => ({ name: i.itemName, amount: Number(i.amount) })),
      bonusItems: bonusItems.map((i) => ({ name: i.itemName, amount: Number(i.amount) })),
      deductionItems: deductionItems.map((i) => ({ name: i.itemName, amount: Number(i.amount) })),
      items: payroll.items.map((i) => ({
        id: i.id,
        itemCode: i.itemCode,
        itemName: i.itemName,
        itemType: i.itemType,
        amount: Number(i.amount),
        quantity: i.quantity ? Number(i.quantity) : null,
        rate: i.rate ? Number(i.rate) : null,
        note: i.note,
      })),
    };
  }

  async uploadOfficialImage(actor: AuthenticatedUser, dto: UploadPayslipImageDto) {
    const { userId, month, year, note } = dto;
    const imageUrl = dto.imageUrl || dto.fileUrl;
    if (!imageUrl) {
      throw badRequest('IMAGE_URL_REQUIRED', 'imageUrl hoặc fileUrl là bắt buộc');
    }

    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const visibleDepartmentIds = isRegionAdmin
      ? ((await this.scope.getVisibleDepartmentIds(actor)) ?? [])
      : await this.scope.getVisibleDepartmentIds(actor);

    if (userId && visibleDepartmentIds !== null) {
      const userInScope = await this.prisma.departmentMember.findFirst({
        where: {
          userId,
          departmentId: { in: visibleDepartmentIds },
        },
      });
      if (!userInScope) {
        throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác nhân sự thuộc phòng ban hoặc vùng khác');
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'PAYROLL_OFFICIAL_IMAGE',
        entityType: 'PayslipImage',
        entityId: userId || null,
        metadata: {
          month,
          year,
          imageUrl,
          note,
        },
      },
    });

    // Gửi thông báo đến nhân sự
    try {
      let targetUserIds: string[] = [];
      if (userId) {
        targetUserIds = [userId];
      } else {
        const activeUsers = await this.prisma.user.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            ...(visibleDepartmentIds !== null
              ? {
                  departmentLinks: {
                    some: {
                      departmentId: {
                        in: visibleDepartmentIds.length > 0 ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'],
                      },
                    },
                  },
                }
              : {}),
          },
          select: { id: true },
        });
        targetUserIds = activeUsers.map((u) => u.id);
      }

      const payload = await this.notifications.createForUsers(this.prisma, targetUserIds, {
        type: NotificationType.PAYSLIP_AVAILABLE,
        title: `Phiếu lương tháng ${month}/${year}`,
        body: `Phòng Kế toán đã phát hành ảnh phiếu lương chốt tháng ${month}/${year}. Vui lòng vào kiểm tra và xác nhận.`,
        metadata: {
          screen: 'EmployeePayslip',
          month,
          year,
          type: 'PAYSLIP_OFFICIAL_IMAGE',
        },
      });
      if (payload) {
        this.notifications.emitCreated(payload);
      }
    } catch (e) {
      // Do not fail upload if notification fails
    }

    return {
      success: true,
      message: 'Đã lưu ảnh phiếu lương chốt chính thức thành công',
      imageUrl,
      month,
      year,
    };
  }

  async getCompanyMonthlyPayslips(actor: AuthenticatedUser, query: CompanyPayslipsQueryDto) {
    const now = new Date();
    const month = query.month ? Number(query.month) : now.getMonth() + 1;
    const year = query.year ? Number(query.year) : now.getFullYear();

    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const visibleDepartmentIds = isRegionAdmin
      ? ((await this.scope.getVisibleDepartmentIds(actor)) ?? [])
      : await this.scope.getVisibleDepartmentIds(actor);

    let departmentFilter: Prisma.DepartmentMemberWhereInput | undefined = undefined;
    if (query.departmentId) {
      if (visibleDepartmentIds !== null && !visibleDepartmentIds.includes(query.departmentId)) {
        throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền truy cập phòng ban này');
      }
      departmentFilter = { departmentId: query.departmentId };
    } else if (visibleDepartmentIds !== null) {
      departmentFilter = {
        departmentId: {
          in: visibleDepartmentIds.length > 0 ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'],
        },
      };
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(departmentFilter ? { departmentLinks: { some: departmentFilter } } : {}),
        ...(query.search
          ? {
              OR: [
                { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
                { userCode: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        profile: { include: { position: true } },
        departmentLinks: { include: { department: true } },
        salaryProfiles: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const period = await this.prisma.payrollPeriod.findFirst({
      where: { month, year },
      include: {
        payrolls: true,
      },
    });

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const results = await Promise.all(
      users.map(async (u) => {
        const payroll = period?.payrolls.find((p) => p.userId === u.id);

        const specificImageLog = await this.prisma.auditLog.findFirst({
          where: {
            action: 'PAYROLL_OFFICIAL_IMAGE',
            entityId: u.id,
          },
          orderBy: { createdAt: 'desc' },
        });
        const imageLog = specificImageLog || await this.prisma.auditLog.findFirst({
          where: {
            action: 'PAYROLL_OFFICIAL_IMAGE',
            entityId: null,
          },
          orderBy: { createdAt: 'desc' },
        });

        let finalOfficialImageUrl: string | null = null;
        if (imageLog?.metadata && typeof imageLog.metadata === 'object') {
          const meta = imageLog.metadata as any;
          if (meta.month === month && meta.year === year) {
            finalOfficialImageUrl = meta.imageUrl || null;
          }
        }

        const baseSalary = payroll ? Number(payroll.baseSalary) : (u.salaryProfiles?.[0]?.baseSalary ? Number(u.salaryProfiles[0].baseSalary) : 0);
        const actualWorkingDays = payroll ? Number(payroll.actualWorkingDays) : await this.prisma.attendanceRecord.count({
          where: {
            userId: u.id,
            workDate: { gte: startOfMonth, lte: endOfMonth },
            status: { in: ['CHECKED_OUT', 'CHECKED_IN', 'ADJUSTED'] },
          },
        });

        return {
          userId: u.id,
          userCode: u.userCode,
          fullName: u.profile?.fullName || 'Nhân sự',
          departmentName: u.departmentLinks?.[0]?.department?.name || 'Chưa có phòng ban',
          positionName: u.profile?.position?.name || 'Nhân viên',
          baseSalary,
          grossSalary: payroll ? Number(payroll.grossSalary) : baseSalary,
          netSalary: payroll ? Number(payroll.netSalary) : baseSalary,
          actualWorkingDays,
          standardWorkingDays: payroll ? Number(payroll.standardWorkingDays) : 26,
          status: payroll ? payroll.status : 'ACTIVE',
          hasData: !!payroll || baseSalary > 0,
          finalOfficialImageUrl,
          employeeAcknowledgedAt: payroll?.employeeAcknowledgedAt?.toISOString() || null,
        };
      }),
    );

    return {
      month,
      year,
      totalEmployees: results.length,
      items: results,
    };
  }

  async acknowledgePayslip(id: string, actor: AuthenticatedUser) {
    const payroll = await this.prisma.payroll.findUnique({ where: { id } });
    if (!payroll) throw notFound('PAYROLL_NOT_FOUND', 'Không tìm thấy phiếu lương');
    if (payroll.userId !== actor.userId) throw forbidden('FORBIDDEN', 'Bạn chỉ có thể xác nhận phiếu lương của chính mình');

    const updated = await this.prisma.payroll.update({
      where: { id },
      data: { employeeAcknowledgedAt: new Date() },
    });

    return {
      success: true,
      message: 'Đã xác nhận phiếu lương thành công',
      employeeAcknowledgedAt: updated.employeeAcknowledgedAt,
    };
  }

  async importPayrolls(actor: AuthenticatedUser, dto: ImportPayrollDto) {
    const { month, year, items } = dto;
    if (!items || items.length === 0) {
      throw badRequest('EMPTY_PAYROLL_ITEMS', 'Danh sách phiếu lương không được để trống');
    }

    // Xác định companyId
    let companyId = dto.companyId;
    if (!companyId) {
      companyId = (await this.prisma.company.findFirst({ select: { id: true } }))?.id;
    }
    if (!companyId) throw badRequest('COMPANY_NOT_FOUND', 'Không tìm thấy thông tin công ty');

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    let successCount = 0;
    const errors: string[] = [];

    const isRegionAdmin = this.scope.isRegionAdmin(actor);
    const visibleDepartmentIds = isRegionAdmin
      ? ((await this.scope.getVisibleDepartmentIds(actor)) ?? [])
      : await this.scope.getVisibleDepartmentIds(actor);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Tìm hoặc tạo PayrollPeriod cho kỳ này
      let period = await tx.payrollPeriod.findFirst({
        where: { companyId, month, year },
      });

      if (!period) {
        const periodCode = `PAY-${year}${String(month).padStart(2, '0')}`;
        period = await tx.payrollPeriod.create({
          data: {
            periodCode,
            companyId,
            month,
            year,
            startDate,
            endDate,
            status: PayrollPeriodStatus.APPROVED,
            calculatedAt: new Date(),
            approvedAt: new Date(),
            createdById: actor.userId,
            approvedById: actor.userId,
          },
        });
      } else if (period.status === PayrollPeriodStatus.DRAFT || period.status === PayrollPeriodStatus.CALCULATED) {
        period = await tx.payrollPeriod.update({
          where: { id: period.id },
          data: {
            status: PayrollPeriodStatus.APPROVED,
            approvedAt: new Date(),
            approvedById: actor.userId,
          },
        });
      }

      const importedUserIds: string[] = [];

      for (const item of items) {
        const user = await tx.user.findFirst({
          where: {
            userCode: item.userCode,
            deletedAt: null,
            ...(visibleDepartmentIds !== null
              ? {
                  departmentLinks: {
                    some: {
                      departmentId: {
                        in: visibleDepartmentIds.length > 0 ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'],
                      },
                    },
                  },
                }
              : {}),
          },
          include: { profile: true, departmentLinks: { include: { department: true } } },
        });

        if (!user) {
          errors.push(`Mã NV ${item.userCode} không tồn tại hoặc không thuộc quyền quản lý`);
          continue;
        }

        // Tìm hoặc tạo SalaryProfile
        let salaryProfile = await tx.salaryProfile.findFirst({
          where: { userId: user.id },
          orderBy: { effectiveFrom: 'desc' },
        });

        if (!salaryProfile) {
          salaryProfile = await tx.salaryProfile.create({
            data: {
              userId: user.id,
              salaryType: SalaryType.MONTHLY,
              baseSalary: item.baseSalary,
              standardWorkingDays: item.standardWorkingDays || 26,
              effectiveFrom: startDate,
              createdById: actor.userId,
            },
          });
        }

        const standardWorkingDays = item.standardWorkingDays || 26;
        const actualWorkingDays = item.actualWorkingDays !== undefined ? item.actualWorkingDays : standardWorkingDays;
        const overtimeMinutes = item.overtimeHours ? Math.round(item.overtimeHours * 60) : 0;
        const overtimeAmount = item.overtimeAmount || 0;
        const allowanceAmount = item.allowanceAmount || 0;
        const bonusAmount = item.bonusAmount || 0;
        const deductionAmount = item.deductionAmount || 0;
        const insuranceAmount = item.insuranceAmount || 0;
        const taxAmount = item.taxAmount || 0;
        const grossSalary = item.actualSalary || (item.baseSalary + overtimeAmount + allowanceAmount + bonusAmount);
        const netSalary = item.netSalary;

        // Upsert Payroll record
        const payroll = await tx.payroll.upsert({
          where: {
            payrollPeriodId_userId: {
              payrollPeriodId: period.id,
              userId: user.id,
            },
          },
          update: {
            baseSalary: item.baseSalary,
            standardWorkingDays,
            actualWorkingDays,
            overtimeMinutes,
            overtimeAmount,
            allowanceAmount,
            bonusAmount,
            deductionAmount,
            insuranceAmount,
            taxAmount,
            grossSalary,
            netSalary,
            status: PayrollStatus.APPROVED,
            calculatedAt: new Date(),
          },
          create: {
            payrollPeriodId: period.id,
            userId: user.id,
            salaryProfileId: salaryProfile.id,
            baseSalary: item.baseSalary,
            standardWorkingDays,
            actualWorkingDays,
            overtimeMinutes,
            overtimeAmount,
            allowanceAmount,
            bonusAmount,
            deductionAmount,
            insuranceAmount,
            taxAmount,
            grossSalary,
            netSalary,
            status: PayrollStatus.APPROVED,
            calculatedAt: new Date(),
          },
        });

        // Xóa items cũ và tạo items mới
        await tx.payrollItem.deleteMany({ where: { payrollId: payroll.id } });

        const payrollItemsToCreate = [];
        // Lương cơ bản
        payrollItemsToCreate.push({
          payrollId: payroll.id,
          itemCode: 'BASIC_SALARY',
          itemName: 'Lương cơ bản',
          itemType: PayrollItemType.EARNING,
          quantity: actualWorkingDays,
          rate: item.baseSalary / standardWorkingDays,
          amount: item.actualSalary || item.baseSalary,
        });

        // Tăng ca
        if (overtimeAmount > 0 || (item.overtimeHours && item.overtimeHours > 0)) {
          payrollItemsToCreate.push({
            payrollId: payroll.id,
            itemCode: 'OVERTIME_PAY',
            itemName: 'Làm thêm giờ (OT)',
            itemType: PayrollItemType.EARNING,
            quantity: item.overtimeHours || 0,
            amount: overtimeAmount,
          });
        }

        // Phụ cấp
        if (allowanceAmount > 0) {
          payrollItemsToCreate.push({
            payrollId: payroll.id,
            itemCode: 'ALLOWANCE',
            itemName: 'Phụ cấp (Ăn trưa, đi lại, trách nhiệm)',
            itemType: PayrollItemType.ALLOWANCE,
            amount: allowanceAmount,
          });
        }

        // Thưởng
        if (bonusAmount > 0) {
          payrollItemsToCreate.push({
            payrollId: payroll.id,
            itemCode: 'BONUS',
            itemName: 'Thưởng hiệu quả / KPI',
            itemType: PayrollItemType.BONUS,
            amount: bonusAmount,
          });
        }

        // Bảo hiểm
        if (insuranceAmount > 0) {
          payrollItemsToCreate.push({
            payrollId: payroll.id,
            itemCode: 'INSURANCE',
            itemName: 'Khấu trừ BHXH, BHYT, BHTN (10.5%)',
            itemType: PayrollItemType.INSURANCE,
            amount: insuranceAmount,
          });
        }

        // Thuế TNCN
        if (taxAmount > 0) {
          payrollItemsToCreate.push({
            payrollId: payroll.id,
            itemCode: 'TAX',
            itemName: 'Thuế thu nhập cá nhân (TNCN)',
            itemType: PayrollItemType.TAX,
            amount: taxAmount,
          });
        }

        // Tạm ứng / Giảm trừ khác
        if (item.advanceAmount && item.advanceAmount > 0) {
          payrollItemsToCreate.push({
            payrollId: payroll.id,
            itemCode: 'ADVANCE',
            itemName: 'Tạm ứng lương',
            itemType: PayrollItemType.DEDUCTION,
            amount: item.advanceAmount,
          });
        }

        if (item.latePenaltyAmount && item.latePenaltyAmount > 0) {
          payrollItemsToCreate.push({
            payrollId: payroll.id,
            itemCode: 'LATE_PENALTY',
            itemName: 'Khấu trừ đi muộn / vi phạm',
            itemType: PayrollItemType.DEDUCTION,
            amount: item.latePenaltyAmount,
          });
        }

        // Items chi tiết khác nếu có
        if (item.itemDetails && item.itemDetails.length > 0) {
          for (const det of item.itemDetails) {
            payrollItemsToCreate.push({
              payrollId: payroll.id,
              itemCode: det.itemCode,
              itemName: det.itemName,
              itemType: det.itemType as PayrollItemType,
              amount: det.amount || 0,
              note: det.note,
            });
          }
        }

        if (payrollItemsToCreate.length > 0) {
          await tx.payrollItem.createMany({ data: payrollItemsToCreate });
        }

        importedUserIds.push(user.id);
        successCount++;
      }

      // Tạo audit log
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'PAYROLL_IMPORTED',
          entityType: 'PayrollPeriod',
          entityId: period.id,
          metadata: { month, year, successCount, errors },
        },
      });

      // Tạo thông báo cho toàn bộ nhân sự được import
      if (importedUserIds.length > 0) {
        const notify = await this.notifications.createForUsers(tx, importedUserIds, {
          type: NotificationType.PAYROLL_APPROVED,
          title: `Phiếu lương tháng ${month}/${year}`,
          body: `Leader Kế toán đã phát hành phiếu lương tháng ${month}/${year}. Hãy kiểm tra và xác nhận!`,
          metadata: { payrollPeriodId: period.id, month, year },
        });
        return { period, notify, importedUserIds, successCount };
      }

      return { period, importedUserIds, successCount };
    });

    // Phát realtime socket events & notifications
    if (result.importedUserIds && result.importedUserIds.length > 0) {
      if (result.notify) {
        this.notifications.emitCreated(result.notify);
      }
      for (const uid of result.importedUserIds) {
        this.realtime.emitToUser(uid, 'payroll:payslip-available', {
          payrollPeriodId: result.period.id,
          month,
          year,
        });
      }
    }

    return {
      success: true,
      month,
      year,
      periodId: result.period.id,
      importedCount: successCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Đã import và phát hành phiếu lương tháng ${month}/${year} thành công cho ${successCount} nhân sự.`,
    };
  }

  private async calculateEmployeePayroll(periodId: string, userId: string, actorUserId: string) {
    const period = await this.prisma.payrollPeriod.findUniqueOrThrow({ where: { id: periodId } });
    const salaryProfile = await this.prisma.salaryProfile.findFirst({
      where: {
        userId,
        effectiveFrom: { lte: period.endDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!salaryProfile) return;

    const [attendanceSummary, leaveSummary, overtimeSummary, components, bonuses, deductions] = await Promise.all([
      this.attendanceSummary(userId, period.startDate, period.endDate),
      this.leaveSummary(userId, period.startDate, period.endDate),
      this.overtimeSummary(userId, period.startDate, period.endDate),
      this.effectiveComponents(userId, period.startDate, period.endDate),
      this.prisma.employeeBonus.findMany({
        where: { userId, status: EmployeeBonusStatus.APPROVED, effectiveDate: { gte: period.startDate, lte: period.endDate } },
      }),
      this.prisma.employeeDeduction.findMany({
        where: { userId, status: EmployeeDeductionStatus.APPROVED, effectiveDate: { gte: period.startDate, lte: period.endDate } },
      }),
    ]);

    const standardWorkingDays = Number(salaryProfile.standardWorkingDays ?? 26);
    const baseSalary = Number(salaryProfile.baseSalary);
    const dailySalary = Number(salaryProfile.dailyRate ?? this.policy.dailySalary(baseSalary, standardWorkingDays));
    const hourlyRate = Number(salaryProfile.hourlyRate ?? dailySalary / 8);
    const paidLeaveDays = leaveSummary.paidLeaveDays;
    const unpaidLeaveDays = leaveSummary.unpaidLeaveDays;
    const payableWorkingDays = Math.max(0, attendanceSummary.actualWorkingDays + paidLeaveDays);
    const basicAmount = salaryProfile.salaryType === 'MONTHLY'
      ? this.policy.dailySalary(baseSalary, standardWorkingDays) * Math.min(standardWorkingDays, payableWorkingDays)
      : salaryProfile.salaryType === 'DAILY'
        ? dailySalary * payableWorkingDays
        : hourlyRate * (attendanceSummary.regularWorkedMinutes / 60);
    const overtimeAmount = this.policy.overtimeAmount(hourlyRate, overtimeSummary.overtimeMinutes, overtimeSummary.multiplier);
    const allowanceAmount = components
      .filter((item) => item.component.componentType === SalaryComponentType.ALLOWANCE)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const recurringDeductionAmount = components
      .filter((item) => item.component.componentType === SalaryComponentType.DEDUCTION)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const bonusAmount = bonuses.reduce((sum, item) => sum + Number(item.amount), 0);
    const approvedDeductionAmount = deductions.reduce((sum, item) => sum + Number(item.amount), 0);
    const unpaidLeaveDeduction = dailySalary * unpaidLeaveDays;
    const deductionAmount = recurringDeductionAmount + approvedDeductionAmount + unpaidLeaveDeduction;
    const grossSalary = basicAmount + overtimeAmount + allowanceAmount + bonusAmount;
    const netSalary = Math.max(0, grossSalary - deductionAmount);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.payroll.findUnique({ where: { payrollPeriodId_userId: { payrollPeriodId: periodId, userId } } });
      if (existing?.status === PayrollStatus.LOCKED) throw conflict('PAYROLL_LOCKED', 'Locked payroll cannot be recalculated');
      if (existing) {
        await tx.payrollCalculationSnapshot.deleteMany({ where: { payrollId: existing.id } });
        await tx.payrollItem.deleteMany({ where: { payrollId: existing.id } });
      }
      const payroll = await tx.payroll.upsert({
        where: { payrollPeriodId_userId: { payrollPeriodId: periodId, userId } },
        update: {
          salaryProfileId: salaryProfile.id,
          baseSalary,
          standardWorkingDays,
          actualWorkingDays: attendanceSummary.actualWorkingDays,
          paidLeaveDays,
          unpaidLeaveDays,
          regularWorkedMinutes: attendanceSummary.regularWorkedMinutes,
          overtimeMinutes: overtimeSummary.overtimeMinutes,
          overtimeAmount,
          allowanceAmount,
          bonusAmount,
          deductionAmount,
          grossSalary,
          netSalary,
          calculatedAt: new Date(),
          status: PayrollStatus.CALCULATED,
          calculationVersion: { increment: 1 },
        },
        create: {
          payrollPeriodId: periodId,
          userId,
          salaryProfileId: salaryProfile.id,
          baseSalary,
          standardWorkingDays,
          actualWorkingDays: attendanceSummary.actualWorkingDays,
          paidLeaveDays,
          unpaidLeaveDays,
          regularWorkedMinutes: attendanceSummary.regularWorkedMinutes,
          overtimeMinutes: overtimeSummary.overtimeMinutes,
          overtimeAmount,
          allowanceAmount,
          bonusAmount,
          deductionAmount,
          insuranceAmount: 0,
          taxAmount: 0,
          grossSalary,
          netSalary,
          calculatedAt: new Date(),
          status: PayrollStatus.CALCULATED,
        },
      });
      await tx.payrollItem.createMany({
        data: [
          { payrollId: payroll.id, itemCode: 'BASIC_SALARY', itemName: 'Basic salary', itemType: PayrollItemType.EARNING, quantity: payableWorkingDays, rate: dailySalary, amount: basicAmount },
          { payrollId: payroll.id, itemCode: 'OVERTIME_PAY', itemName: 'Overtime pay', itemType: PayrollItemType.EARNING, quantity: overtimeSummary.overtimeMinutes / 60, rate: hourlyRate * overtimeSummary.multiplier, amount: overtimeAmount },
          { payrollId: payroll.id, itemCode: 'UNPAID_LEAVE_DEDUCTION', itemName: 'Unpaid leave deduction', itemType: PayrollItemType.DEDUCTION, quantity: unpaidLeaveDays, rate: dailySalary, amount: unpaidLeaveDeduction },
          ...components.map((item) => ({
            payrollId: payroll.id,
            componentId: item.componentId,
            itemCode: item.component.code,
            itemName: item.component.name,
            itemType: this.toPayrollItemType(item.component.componentType),
            amount: Number(item.amount),
          })),
          ...bonuses.map((item) => ({ payrollId: payroll.id, itemCode: item.bonusType, itemName: item.title, itemType: PayrollItemType.BONUS, sourceType: 'EmployeeBonus', sourceId: item.id, amount: Number(item.amount) })),
          ...deductions.map((item) => ({ payrollId: payroll.id, itemCode: item.deductionType, itemName: item.title, itemType: PayrollItemType.DEDUCTION, sourceType: 'EmployeeDeduction', sourceId: item.id, amount: Number(item.amount) })),
        ],
      });
      await tx.payrollCalculationSnapshot.create({
        data: {
          payrollId: payroll.id,
          attendanceSummary: attendanceSummary as unknown as Prisma.InputJsonValue,
          leaveSummary: leaveSummary as unknown as Prisma.InputJsonValue,
          overtimeSummary: overtimeSummary as unknown as Prisma.InputJsonValue,
          salaryProfileSnapshot: salaryProfile as unknown as Prisma.InputJsonValue,
          componentSnapshot: components as unknown as Prisma.InputJsonValue,
          bonusSnapshot: bonuses as unknown as Prisma.InputJsonValue,
          deductionSnapshot: deductions as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.employeeBonus.updateMany({ where: { id: { in: bonuses.map((item) => item.id) } }, data: { status: EmployeeBonusStatus.APPLIED_TO_PAYROLL } });
      await tx.employeeDeduction.updateMany({ where: { id: { in: deductions.map((item) => item.id) } }, data: { status: EmployeeDeductionStatus.APPLIED_TO_PAYROLL } });
    });
  }

  private async attendanceSummary(userId: string, startDate: Date, endDate: Date) {
    const [records, memberships] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: { userId, workDate: { gte: startDate, lte: endDate } },
        include: { shiftAssignment: { include: { shift: true } } },
      }),
      this.prisma.departmentMember.findMany({
        where: { userId, leftAt: null },
        include: { department: true },
      }),
    ]);

    const isLive = memberships.some((m) =>
      Boolean(
        (m.department?.name && m.department.name.toLowerCase().includes('live')) ||
        (m.department?.code && m.department.code.toLowerCase().includes('live')),
      ),
    );

    let actualWorkingDays = 0;
    let regularWorkedMinutes = 0;
    let lateMinutes = 0;
    let earlyLeaveMinutes = 0;

    for (const record of records) {
      if (isLive) {
        // Phòng Live: có check-in là 1 công (hỗ trợ live qua đêm)
        actualWorkingDays += 1;
      } else {
        // Phòng tiêu chuẩn: chỉ tính công nếu đã checkout hoặc được duyệt điều chỉnh (ADJUSTED)
        if (record.checkOutAt || record.status === 'ADJUSTED') {
          actualWorkingDays += 1;
        }
      }

      if (record.checkOutAt) {
        regularWorkedMinutes += Math.max(0, Math.floor((record.checkOutAt.getTime() - record.checkInAt.getTime()) / 60_000));
      }
      const shift = record.shiftAssignment?.shift;
      if (shift) {
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const shiftStart = new Date(record.workDate);
        shiftStart.setHours(startHour, startMinute, 0, 0);
        lateMinutes += Math.max(0, Math.floor((record.checkInAt.getTime() - shiftStart.getTime()) / 60_000));
        if (record.checkOutAt) {
          const [endHour, endMinute] = shift.endTime.split(':').map(Number);
          const shiftEnd = new Date(record.workDate);
          shiftEnd.setHours(endHour, endMinute, 0, 0);
          earlyLeaveMinutes += Math.max(0, Math.floor((shiftEnd.getTime() - record.checkOutAt.getTime()) / 60_000));
        }
      } else if (record.lateMinutes) {
        lateMinutes += record.lateMinutes;
      }
    }
    return { actualWorkingDays, regularWorkedMinutes, lateMinutes, earlyLeaveMinutes };
  }

  private async leaveSummary(userId: string, startDate: Date, endDate: Date) {
    const leaves = await this.prisma.leaveRequest.findMany({
      where: { userId, status: LeaveRequestStatus.APPROVED, startDate: { lte: endDate }, endDate: { gte: startDate } },
      include: { leaveType: true },
    });
    return leaves.reduce(
      (summary, leave) => {
        if (leave.leaveType.isPaid) summary.paidLeaveDays += Number(leave.totalDays);
        else summary.unpaidLeaveDays += Number(leave.totalDays);
        return summary;
      },
      { paidLeaveDays: 0, unpaidLeaveDays: 0 },
    );
  }

  private async overtimeSummary(userId: string, startDate: Date, endDate: Date) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        userId,
        workDate: { gte: startDate, lte: endDate },
        checkOutAt: { not: null },
      },
      include: {
        shiftAssignment: { include: { shift: true } },
      },
    });

    const [approvedOts, approvedLiveOts] = await Promise.all([
      this.prisma.overtimeRequest.findMany({
        where: {
          userId,
          status: OvertimeRequestStatus.APPROVED,
          workDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.otReport.findMany({
        where: {
          userId,
          status: OtReportStatus.APPROVED,
          otDate: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    let totalApprovedOtMinutes = 0;

    // Cộng OT phòng Live từ các OtReport đã duyệt
    for (const liveOt of approvedLiveOts) {
      if (liveOt.validOtMinutes > 0) {
        totalApprovedOtMinutes += liveOt.validOtMinutes;
      }
    }

    for (const record of records) {
      if (!record.checkOutAt) continue;
      const shift = record.shiftAssignment?.shift;
      if (!shift) {
        // OT ngày nghỉ / không ca: giao giữa thời gian quẹt thẻ [checkInAt..checkOutAt] và đơn OT APPROVED
        const dayOts = approvedOts.filter(o => o.workDate.getTime() === record.workDate.getTime());
        for (const ot of dayOts) {
          const otStart = record.checkInAt > ot.startAt ? record.checkInAt : ot.startAt;
          const otEnd = record.checkOutAt < ot.endAt ? record.checkOutAt : ot.endAt;
          if (otEnd > otStart) {
            totalApprovedOtMinutes += Math.floor((otEnd.getTime() - otStart.getTime()) / 60_000);
          }
        }
      } else {
        // Có ca: tính OT cả trước và sau ca
        const [sh, sm] = shift.startTime.split(':').map(Number);
        const scheduledStart = new Date(record.workDate);
        scheduledStart.setHours(sh, sm, 0, 0);

        const [eh, em] = shift.endTime.split(':').map(Number);
        const scheduledEnd = new Date(record.workDate);
        scheduledEnd.setHours(eh, em, 0, 0);
        if (scheduledEnd <= scheduledStart) {
          scheduledEnd.setDate(scheduledEnd.getDate() + 1);
        }

        const dayOts = approvedOts.filter(o => o.workDate.getTime() === record.workDate.getTime());

        // OT TRƯỚC CA: giao điểm [checkInAt ─── shiftStart] ∩ [đơn OT]
        if (record.checkInAt < scheduledStart) {
          for (const ot of dayOts) {
            const otStart = record.checkInAt > ot.startAt ? record.checkInAt : ot.startAt;
            const otEnd   = scheduledStart < ot.endAt ? scheduledStart : ot.endAt;
            if (otEnd > otStart) {
              totalApprovedOtMinutes += Math.floor((otEnd.getTime() - otStart.getTime()) / 60_000);
            }
          }
        }

        // OT SAU CA: giao điểm [shiftEnd ─── checkOut] ∩ [đơn OT]
        if (record.checkOutAt > scheduledEnd) {
          for (const ot of dayOts) {
            const otStart = ot.startAt > scheduledEnd ? ot.startAt : scheduledEnd;
            const otEnd = ot.endAt < record.checkOutAt ? ot.endAt : record.checkOutAt;
            if (otEnd > otStart) {
              totalApprovedOtMinutes += Math.floor((otEnd.getTime() - otStart.getTime()) / 60_000);
            }
          }
        }
      }
    }

    return { overtimeMinutes: totalApprovedOtMinutes, multiplier: 1.5, policy: 'APPROVED_OVERTIME_ONLY' };
  }

  private effectiveComponents(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.employeeSalaryComponent.findMany({
      where: { userId, effectiveFrom: { lte: endDate }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }] },
      include: { component: true },
    });
  }

  private toPayrollItemType(type: SalaryComponentType): PayrollItemType {
    const mapping: Record<SalaryComponentType, PayrollItemType> = {
      EARNING: PayrollItemType.EARNING,
      ALLOWANCE: PayrollItemType.ALLOWANCE,
      BONUS: PayrollItemType.BONUS,
      DEDUCTION: PayrollItemType.DEDUCTION,
      TAX: PayrollItemType.TAX,
      INSURANCE: PayrollItemType.INSURANCE,
      OTHER: PayrollItemType.OTHER,
    };
    return mapping[type];
  }

  async uploadDepartmentPayslipBatch(actor: AuthenticatedUser, dto: UploadDepartmentPayslipBatchDto) {
    const { departmentId, month, year, imageUrls, note } = dto;
    if (!imageUrls || imageUrls.length === 0) {
      throw badRequest('IMAGE_URLS_REQUIRED', 'Cần ít nhất 1 ảnh để tải lên lô');
    }

    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        leader: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    });
    if (!dept) throw notFound('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');

    // Tìm batch hiện tại nếu có
    const existingLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'PAYROLL_DEPARTMENT_BATCH',
        entityId: departmentId,
      },
      orderBy: { createdAt: 'desc' },
    });

    let currentImages: Array<{
      id: string;
      imageUrl: string;
      assignedUserId?: string | null;
      assignedUserName?: string | null;
      labeledById?: string | null;
      labeledAt?: string | null;
    }> = [];

    if (existingLog?.metadata && typeof existingLog.metadata === 'object') {
      const meta = existingLog.metadata as any;
      if (meta.month === month && meta.year === year && Array.isArray(meta.images)) {
        currentImages = meta.images;
      }
    }

    // Thêm các ảnh mới vào pool
    const newImageItems = imageUrls.map((url) => ({
      id: randomUUID(),
      imageUrl: url,
      assignedUserId: null,
      assignedUserName: null,
      labeledById: null,
      labeledAt: null,
    }));

    const allImages = [...currentImages, ...newImageItems];

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'PAYROLL_DEPARTMENT_BATCH',
        entityType: 'DepartmentPayslipBatch',
        entityId: departmentId,
        metadata: {
          departmentId,
          departmentName: dept.name,
          month,
          year,
          note,
          images: allImages,
          uploadedAt: new Date().toISOString(),
          uploadedBy: (actor as any).fullName || (actor as any).email || actor.userId,
        },
      },
    });

    // Bắn thông báo cho Leader phòng ban
    try {
      const leaderIds = dept.leaderUserId ? [dept.leaderUserId] : [];

      if (leaderIds.length > 0) {
        const notif = await this.notifications.createForUsers(this.prisma, leaderIds, {
          type: NotificationType.PAYSLIP_AVAILABLE,
          title: `Lô ảnh phiếu lương phòng ${dept.name} 📑`,
          body: `Kế toán đã tải lên ${newImageItems.length} ảnh phiếu lương tháng ${month}/${year}. Vui lòng vào gán nhãn cho từng nhân viên.`,
          metadata: {
            screen: 'DepartmentPayslipLabeling',
            departmentId,
            month,
            year,
          },
        });
        if (notif) this.notifications.emitCreated(notif);
      }
    } catch {
      // Ignore notif error
    }

    return {
      success: true,
      message: `Đã tải lên ${newImageItems.length} ảnh phiếu lương cho phòng ${dept.name} thành công`,
      totalImages: allImages.length,
      unassignedCount: allImages.filter((img) => !img.assignedUserId).length,
    };
  }

  async getDepartmentPayslipBatch(actor: AuthenticatedUser, query: GetDepartmentBatchQueryDto) {
    const now = new Date();
    const month = query.month ? Number(query.month) : now.getMonth() + 1;
    const year = query.year ? Number(query.year) : now.getFullYear();

    let departmentId = query.departmentId;
    if (!departmentId) {
      // Tìm phòng ban của actor nếu là leader
      const member = await this.prisma.departmentMember.findFirst({
        where: { userId: actor.userId },
        select: { departmentId: true },
      });
      departmentId = member?.departmentId;
    }

    if (!departmentId) {
      throw badRequest('DEPARTMENT_ID_REQUIRED', 'Cần cung cấp departmentId');
    }

    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        members: {
          where: { user: { isActive: true, deletedAt: null } },
          include: {
            user: {
              include: {
                profile: { include: { position: true } },
              },
            },
          },
        },
      },
    });
    if (!dept) throw notFound('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');

    // Lấy batch log mới nhất
    const batchLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'PAYROLL_DEPARTMENT_BATCH',
        entityId: departmentId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let batchImages: Array<{
      id: string;
      imageUrl: string;
      assignedUserId?: string | null;
      assignedUserName?: string | null;
      labeledById?: string | null;
      labeledAt?: string | null;
    }> = [];

    for (const log of batchLogs) {
      if (log.metadata && typeof log.metadata === 'object') {
        const meta = log.metadata as any;
        if (meta.month === month && meta.year === year && Array.isArray(meta.images)) {
          batchImages = meta.images;
          break;
        }
      }
    }

    // Danh sách nhân viên trong phòng
    const employees = dept.members.map((m) => {
      const u = m.user;
      const assignedImage = batchImages.find((img) => img.assignedUserId === u.id);
      return {
        userId: u.id,
        userCode: u.userCode,
        fullName: u.profile?.fullName || 'Nhân sự',
        avatarUrl: u.profile?.avatarUrl || null,
        positionName: u.profile?.position?.name || 'Nhân viên',
        hasPayslip: Boolean(assignedImage),
        assignedImageId: assignedImage?.id || null,
        assignedImageUrl: assignedImage?.imageUrl || null,
      };
    });

    const unassignedImages = batchImages.filter((img) => !img.assignedUserId);
    const assignedImages = batchImages.filter((img) => Boolean(img.assignedUserId));

    return {
      departmentId,
      departmentName: dept.name,
      month,
      year,
      totalImages: batchImages.length,
      unassignedImages,
      assignedImages,
      employees,
    };
  }

  async assignDepartmentPayslipImage(actor: AuthenticatedUser, dto: AssignDepartmentPayslipImageDto) {
    const { departmentId, month, year, imageId, targetUserId } = dto;

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });
    if (!targetUser) throw notFound('USER_NOT_FOUND', 'Không tìm thấy nhân sự');

    // Lấy batch log mới nhất
    const batchLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'PAYROLL_DEPARTMENT_BATCH',
        entityId: departmentId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let targetLog: any = null;
    let batchImages: any[] = [];

    for (const log of batchLogs) {
      if (log.metadata && typeof log.metadata === 'object') {
        const meta = log.metadata as any;
        if (meta.month === month && meta.year === year && Array.isArray(meta.images)) {
          targetLog = log;
          batchImages = [...meta.images];
          break;
        }
      }
    }

    const imageIndex = batchImages.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) {
      throw notFound('IMAGE_NOT_FOUND', 'Không tìm thấy ảnh trong lô');
    }

    const targetImageUrl = batchImages[imageIndex].imageUrl;

    // Cập nhật gán nhãn
    batchImages[imageIndex] = {
      ...batchImages[imageIndex],
      assignedUserId: targetUser.id,
      assignedUserName: targetUser.profile?.fullName || targetUser.userCode,
      labeledById: actor.userId,
      labeledAt: new Date().toISOString(),
    };

    // Tạo bản ghi log cập nhật batch
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'PAYROLL_DEPARTMENT_BATCH',
        entityType: 'DepartmentPayslipBatch',
        entityId: departmentId,
        metadata: {
          ...(targetLog?.metadata || {}),
          departmentId,
          month,
          year,
          images: batchImages,
          lastUpdatedBy: (actor as any).fullName || (actor as any).email || actor.userId,
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    });

    // Đồng thời cập nhật vào ảnh chính thức của nhân sự
    await this.uploadOfficialImage(actor, {
      userId: targetUserId,
      month,
      year,
      imageUrl: targetImageUrl,
      note: `Gán từ lô phòng ban`,
    });

    return {
      success: true,
      message: `Đã gán ảnh phiếu lương cho ${targetUser.profile?.fullName || targetUser.userCode} thành công`,
      assignedUserId: targetUser.id,
      assignedImageUrl: targetImageUrl,
    };
  }

  async unassignDepartmentPayslipImage(actor: AuthenticatedUser, dto: UnassignDepartmentPayslipImageDto) {
    const { departmentId, month, year, imageId } = dto;

    const batchLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'PAYROLL_DEPARTMENT_BATCH',
        entityId: departmentId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let targetLog: any = null;
    let batchImages: any[] = [];

    for (const log of batchLogs) {
      if (log.metadata && typeof log.metadata === 'object') {
        const meta = log.metadata as any;
        if (meta.month === month && meta.year === year && Array.isArray(meta.images)) {
          targetLog = log;
          batchImages = [...meta.images];
          break;
        }
      }
    }

    const imageIndex = batchImages.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) {
      throw notFound('IMAGE_NOT_FOUND', 'Không tìm thấy ảnh trong lô');
    }

    const previousUserId = batchImages[imageIndex].assignedUserId;

    // Hủy gán
    batchImages[imageIndex] = {
      ...batchImages[imageIndex],
      assignedUserId: null,
      assignedUserName: null,
      labeledById: null,
      labeledAt: null,
    };

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'PAYROLL_DEPARTMENT_BATCH',
        entityType: 'DepartmentPayslipBatch',
        entityId: departmentId,
        metadata: {
          ...(targetLog?.metadata || {}),
          departmentId,
          month,
          year,
          images: batchImages,
          lastUpdatedBy: (actor as any).fullName || (actor as any).email || actor.userId,
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: 'Đã hủy gán ảnh phiếu lương thành công',
      unassignedImageId: imageId,
      previousUserId,
    };
  }
}

