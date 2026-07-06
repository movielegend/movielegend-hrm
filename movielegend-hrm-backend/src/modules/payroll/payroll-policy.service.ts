import { Injectable } from '@nestjs/common';
import { PayrollPeriodStatus } from '@prisma/client';
import { badRequest } from '../../common/utils/error.util';

@Injectable()
export class PayrollPolicyService {
  assertPeriodTransition(from: PayrollPeriodStatus, to: PayrollPeriodStatus): void {
    const allowed: Record<PayrollPeriodStatus, PayrollPeriodStatus[]> = {
      DRAFT: [PayrollPeriodStatus.CALCULATING, PayrollPeriodStatus.CANCELLED],
      CALCULATING: [PayrollPeriodStatus.CALCULATED, PayrollPeriodStatus.DRAFT],
      CALCULATED: [PayrollPeriodStatus.CALCULATING, PayrollPeriodStatus.UNDER_REVIEW, PayrollPeriodStatus.CANCELLED],
      UNDER_REVIEW: [PayrollPeriodStatus.APPROVED, PayrollPeriodStatus.CALCULATED],
      APPROVED: [PayrollPeriodStatus.LOCKED],
      LOCKED: [],
      CANCELLED: [],
    };
    if (!allowed[from].includes(to)) {
      throw badRequest('INVALID_PAYROLL_PERIOD_TRANSITION', `Cannot move payroll period from ${from} to ${to}`);
    }
  }

  dailySalary(baseSalary: number, standardWorkingDays: number): number {
    return standardWorkingDays > 0 ? baseSalary / standardWorkingDays : 0;
  }

  overtimeAmount(hourlyRate: number, minutes: number, multiplier: number): number {
    return hourlyRate * (minutes / 60) * multiplier;
  }
}
