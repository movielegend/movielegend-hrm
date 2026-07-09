import { PayrollPeriodStatus } from '@prisma/client';
export declare class PayrollPolicyService {
    assertPeriodTransition(from: PayrollPeriodStatus, to: PayrollPeriodStatus): void;
    dailySalary(baseSalary: number, standardWorkingDays: number): number;
    overtimeAmount(hourlyRate: number, minutes: number, multiplier: number): number;
}
