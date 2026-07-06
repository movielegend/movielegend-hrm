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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
const payroll_policy_service_1 = require("./payroll-policy.service");
let PayrollService = class PayrollService {
    prisma;
    policy;
    notifications;
    realtime;
    constructor(prisma, policy, notifications, realtime) {
        this.prisma = prisma;
        this.policy = policy;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    createPeriod(dto, actor) {
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
    async findPeriod(id) {
        const period = await this.prisma.payrollPeriod.findUnique({ where: { id }, include: { payrolls: true } });
        if (!period)
            throw (0, error_util_1.notFound)('PAYROLL_PERIOD_NOT_FOUND', 'Payroll period not found');
        return period;
    }
    async calculatePeriod(id, actor, recalculate = false) {
        const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
        if (!period)
            throw (0, error_util_1.notFound)('PAYROLL_PERIOD_NOT_FOUND', 'Payroll period not found');
        if (period.status === client_1.PayrollPeriodStatus.LOCKED)
            throw (0, error_util_1.conflict)('PAYROLL_PERIOD_LOCKED', 'Locked payroll cannot be recalculated');
        const allowed = recalculate
            ? [client_1.PayrollPeriodStatus.DRAFT, client_1.PayrollPeriodStatus.CALCULATED]
            : [client_1.PayrollPeriodStatus.DRAFT, client_1.PayrollPeriodStatus.CALCULATED];
        if (!allowed.includes(period.status))
            throw (0, error_util_1.conflict)('PAYROLL_PERIOD_NOT_CALCULABLE', 'Payroll period cannot be calculated now');
        const claimed = await this.prisma.payrollPeriod.updateMany({
            where: { id, status: { in: allowed } },
            data: { status: client_1.PayrollPeriodStatus.CALCULATING },
        });
        if (claimed.count !== 1)
            throw (0, error_util_1.conflict)('PAYROLL_CALCULATION_IN_PROGRESS', 'Payroll period is being calculated');
        try {
            const employees = await this.prisma.user.findMany({
                where: { isActive: true, accountStatus: client_1.AccountStatus.ACTIVE, deletedAt: null },
                select: { id: true },
            });
            for (const employee of employees) {
                await this.calculateEmployeePayroll(id, employee.id, actor.userId);
            }
            const updated = await this.prisma.payrollPeriod.update({
                where: { id },
                data: { status: client_1.PayrollPeriodStatus.CALCULATED, calculatedAt: new Date() },
            });
            await this.prisma.auditLog.create({
                data: { actorUserId: actor.userId, action: recalculate ? 'PAYROLL_RECALCULATED' : 'PAYROLL_CALCULATED', entityType: 'PayrollPeriod', entityId: id },
            });
            this.realtime.emitToRoom('payroll:admin', 'payroll:period-updated', { id, status: updated.status });
            return updated;
        }
        catch (error) {
            await this.prisma.payrollPeriod.update({ where: { id }, data: { status: client_1.PayrollPeriodStatus.DRAFT } });
            throw error;
        }
    }
    recalculatePeriod(id, actor) {
        return this.calculatePeriod(id, actor, true);
    }
    async submitReview(id, actor) {
        const period = await this.findPeriod(id);
        this.policy.assertPeriodTransition(period.status, client_1.PayrollPeriodStatus.UNDER_REVIEW);
        const updated = await this.prisma.payrollPeriod.update({
            where: { id },
            data: { status: client_1.PayrollPeriodStatus.UNDER_REVIEW, reviewedAt: new Date(), reviewedById: actor.userId },
        });
        this.realtime.emitToRoom('payroll:admin', 'payroll:period-updated', { id, status: updated.status });
        return updated;
    }
    async approve(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.payrollPeriod.updateMany({
                where: { id, status: client_1.PayrollPeriodStatus.UNDER_REVIEW },
                data: { status: client_1.PayrollPeriodStatus.APPROVED, approvedAt: new Date(), approvedById: actor.userId },
            });
            if (updated.count !== 1)
                throw (0, error_util_1.conflict)('PAYROLL_PERIOD_NOT_UNDER_REVIEW', 'Payroll period must be under review before approval');
            await tx.payroll.updateMany({ where: { payrollPeriodId: id }, data: { status: client_1.PayrollStatus.APPROVED } });
            const payrolls = await tx.payroll.findMany({ where: { payrollPeriodId: id }, select: { userId: true } });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'PAYROLL_APPROVED', entityType: 'PayrollPeriod', entityId: id } });
            const notify = await this.notifications.createForUsers(tx, payrolls.map((item) => item.userId), {
                type: client_1.NotificationType.PAYROLL_APPROVED,
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
    async lock(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const period = await tx.payrollPeriod.findUnique({ where: { id } });
            if (!period)
                throw (0, error_util_1.notFound)('PAYROLL_PERIOD_NOT_FOUND', 'Payroll period not found');
            if (period.status !== client_1.PayrollPeriodStatus.APPROVED)
                throw (0, error_util_1.conflict)('PAYROLL_PERIOD_NOT_APPROVED', 'Payroll period must be approved before lock');
            await tx.payroll.updateMany({ where: { payrollPeriodId: id }, data: { status: client_1.PayrollStatus.LOCKED } });
            const updated = await tx.payrollPeriod.updateMany({
                where: { id, status: client_1.PayrollPeriodStatus.APPROVED },
                data: { status: client_1.PayrollPeriodStatus.LOCKED, lockedAt: new Date(), lockedById: actor.userId },
            });
            if (updated.count !== 1)
                throw (0, error_util_1.conflict)('PAYROLL_PERIOD_NOT_APPROVED', 'Payroll period must be approved before lock');
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'PAYROLL_LOCKED', entityType: 'PayrollPeriod', entityId: id } });
            return tx.payrollPeriod.findUniqueOrThrow({ where: { id } });
        });
        this.realtime.emitToRoom('payroll:admin', 'payroll:period-updated', { id, status: payload.status });
        return payload;
    }
    findPeriodPayrolls(periodId) {
        return this.prisma.payroll.findMany({
            where: { payrollPeriodId: periodId },
            include: { user: { select: { id: true, userCode: true, email: true, phone: true, profile: true } }, items: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findPayroll(id) {
        const payroll = await this.prisma.payroll.findUnique({ where: { id }, include: { period: true, items: true, snapshot: true } });
        if (!payroll)
            throw (0, error_util_1.notFound)('PAYROLL_NOT_FOUND', 'Payroll not found');
        return payroll;
    }
    myPayrolls(actor) {
        return this.prisma.payroll.findMany({
            where: { userId: actor.userId, status: { in: [client_1.PayrollStatus.APPROVED, client_1.PayrollStatus.LOCKED] } },
            include: { period: true, items: true },
            orderBy: { calculatedAt: 'desc' },
        });
    }
    async myPayroll(id, actor) {
        const payroll = await this.prisma.payroll.findUnique({ where: { id }, include: { period: true, items: true, snapshot: true } });
        if (!payroll)
            throw (0, error_util_1.notFound)('PAYROLL_NOT_FOUND', 'Payroll not found');
        if (payroll.userId !== actor.userId)
            throw (0, error_util_1.forbidden)('PAYROLL_OWNER_ONLY', 'Cannot view another employee payroll');
        const visibleStatuses = [client_1.PayrollStatus.APPROVED, client_1.PayrollStatus.LOCKED];
        if (!visibleStatuses.includes(payroll.status)) {
            throw (0, error_util_1.forbidden)('PAYROLL_NOT_VISIBLE', 'Payroll is not visible yet');
        }
        return payroll;
    }
    async calculateEmployeePayroll(periodId, userId, actorUserId) {
        const period = await this.prisma.payrollPeriod.findUniqueOrThrow({ where: { id: periodId } });
        const salaryProfile = await this.prisma.salaryProfile.findFirst({
            where: {
                userId,
                effectiveFrom: { lte: period.endDate },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startDate } }],
            },
            orderBy: { effectiveFrom: 'desc' },
        });
        if (!salaryProfile)
            return;
        const [attendanceSummary, leaveSummary, overtimeSummary, components, bonuses, deductions] = await Promise.all([
            this.attendanceSummary(userId, period.startDate, period.endDate),
            this.leaveSummary(userId, period.startDate, period.endDate),
            this.overtimeSummary(userId, period.startDate, period.endDate),
            this.effectiveComponents(userId, period.startDate, period.endDate),
            this.prisma.employeeBonus.findMany({
                where: { userId, status: client_1.EmployeeBonusStatus.APPROVED, effectiveDate: { gte: period.startDate, lte: period.endDate } },
            }),
            this.prisma.employeeDeduction.findMany({
                where: { userId, status: client_1.EmployeeDeductionStatus.APPROVED, effectiveDate: { gte: period.startDate, lte: period.endDate } },
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
            .filter((item) => item.component.componentType === client_1.SalaryComponentType.ALLOWANCE)
            .reduce((sum, item) => sum + Number(item.amount), 0);
        const recurringDeductionAmount = components
            .filter((item) => item.component.componentType === client_1.SalaryComponentType.DEDUCTION)
            .reduce((sum, item) => sum + Number(item.amount), 0);
        const bonusAmount = bonuses.reduce((sum, item) => sum + Number(item.amount), 0);
        const approvedDeductionAmount = deductions.reduce((sum, item) => sum + Number(item.amount), 0);
        const unpaidLeaveDeduction = dailySalary * unpaidLeaveDays;
        const deductionAmount = recurringDeductionAmount + approvedDeductionAmount + unpaidLeaveDeduction;
        const grossSalary = basicAmount + overtimeAmount + allowanceAmount + bonusAmount;
        const netSalary = Math.max(0, grossSalary - deductionAmount);
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.payroll.findUnique({ where: { payrollPeriodId_userId: { payrollPeriodId: periodId, userId } } });
            if (existing?.status === client_1.PayrollStatus.LOCKED)
                throw (0, error_util_1.conflict)('PAYROLL_LOCKED', 'Locked payroll cannot be recalculated');
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
                    status: client_1.PayrollStatus.CALCULATED,
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
                    status: client_1.PayrollStatus.CALCULATED,
                },
            });
            await tx.payrollItem.createMany({
                data: [
                    { payrollId: payroll.id, itemCode: 'BASIC_SALARY', itemName: 'Basic salary', itemType: client_1.PayrollItemType.EARNING, quantity: payableWorkingDays, rate: dailySalary, amount: basicAmount },
                    { payrollId: payroll.id, itemCode: 'OVERTIME_PAY', itemName: 'Overtime pay', itemType: client_1.PayrollItemType.EARNING, quantity: overtimeSummary.overtimeMinutes / 60, rate: hourlyRate * overtimeSummary.multiplier, amount: overtimeAmount },
                    { payrollId: payroll.id, itemCode: 'UNPAID_LEAVE_DEDUCTION', itemName: 'Unpaid leave deduction', itemType: client_1.PayrollItemType.DEDUCTION, quantity: unpaidLeaveDays, rate: dailySalary, amount: unpaidLeaveDeduction },
                    ...components.map((item) => ({
                        payrollId: payroll.id,
                        componentId: item.componentId,
                        itemCode: item.component.code,
                        itemName: item.component.name,
                        itemType: this.toPayrollItemType(item.component.componentType),
                        amount: Number(item.amount),
                    })),
                    ...bonuses.map((item) => ({ payrollId: payroll.id, itemCode: item.bonusType, itemName: item.title, itemType: client_1.PayrollItemType.BONUS, sourceType: 'EmployeeBonus', sourceId: item.id, amount: Number(item.amount) })),
                    ...deductions.map((item) => ({ payrollId: payroll.id, itemCode: item.deductionType, itemName: item.title, itemType: client_1.PayrollItemType.DEDUCTION, sourceType: 'EmployeeDeduction', sourceId: item.id, amount: Number(item.amount) })),
                ],
            });
            await tx.payrollCalculationSnapshot.create({
                data: {
                    payrollId: payroll.id,
                    attendanceSummary: attendanceSummary,
                    leaveSummary: leaveSummary,
                    overtimeSummary: overtimeSummary,
                    salaryProfileSnapshot: salaryProfile,
                    componentSnapshot: components,
                    bonusSnapshot: bonuses,
                    deductionSnapshot: deductions,
                },
            });
            await tx.employeeBonus.updateMany({ where: { id: { in: bonuses.map((item) => item.id) } }, data: { status: client_1.EmployeeBonusStatus.APPLIED_TO_PAYROLL } });
            await tx.employeeDeduction.updateMany({ where: { id: { in: deductions.map((item) => item.id) } }, data: { status: client_1.EmployeeDeductionStatus.APPLIED_TO_PAYROLL } });
        });
    }
    async attendanceSummary(userId, startDate, endDate) {
        const records = await this.prisma.attendanceRecord.findMany({
            where: { userId, workDate: { gte: startDate, lte: endDate } },
            include: { shiftAssignment: { include: { shift: true } } },
        });
        let regularWorkedMinutes = 0;
        let lateMinutes = 0;
        let earlyLeaveMinutes = 0;
        for (const record of records) {
            if (record.checkOutAt)
                regularWorkedMinutes += Math.max(0, Math.floor((record.checkOutAt.getTime() - record.checkInAt.getTime()) / 60_000));
            const shift = record.shiftAssignment.shift;
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
        }
        return { actualWorkingDays: records.length, regularWorkedMinutes, lateMinutes, earlyLeaveMinutes };
    }
    async leaveSummary(userId, startDate, endDate) {
        const leaves = await this.prisma.leaveRequest.findMany({
            where: { userId, status: client_1.LeaveRequestStatus.APPROVED, startDate: { lte: endDate }, endDate: { gte: startDate } },
            include: { leaveType: true },
        });
        return leaves.reduce((summary, leave) => {
            if (leave.leaveType.isPaid)
                summary.paidLeaveDays += Number(leave.totalDays);
            else
                summary.unpaidLeaveDays += Number(leave.totalDays);
            return summary;
        }, { paidLeaveDays: 0, unpaidLeaveDays: 0 });
    }
    async overtimeSummary(userId, startDate, endDate) {
        const ots = await this.prisma.overtimeRequest.findMany({
            where: { userId, status: client_1.OvertimeRequestStatus.APPROVED, workDate: { gte: startDate, lte: endDate } },
        });
        const overtimeMinutes = ots.reduce((sum, item) => sum + Math.max(0, Math.floor((item.endAt.getTime() - item.startAt.getTime()) / 60_000)), 0);
        return { overtimeMinutes, multiplier: 1.5, policy: 'APPROVED_OVERTIME_ONLY' };
    }
    effectiveComponents(userId, startDate, endDate) {
        return this.prisma.employeeSalaryComponent.findMany({
            where: { userId, effectiveFrom: { lte: endDate }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }] },
            include: { component: true },
        });
    }
    toPayrollItemType(type) {
        const mapping = {
            EARNING: client_1.PayrollItemType.EARNING,
            ALLOWANCE: client_1.PayrollItemType.ALLOWANCE,
            BONUS: client_1.PayrollItemType.BONUS,
            DEDUCTION: client_1.PayrollItemType.DEDUCTION,
            TAX: client_1.PayrollItemType.TAX,
            INSURANCE: client_1.PayrollItemType.INSURANCE,
            OTHER: client_1.PayrollItemType.OTHER,
        };
        return mapping[type];
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payroll_policy_service_1.PayrollPolicyService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map