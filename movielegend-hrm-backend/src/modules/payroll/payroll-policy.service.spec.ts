import { PayrollPeriodStatus } from '@prisma/client';
import { PayrollPolicyService } from './payroll-policy.service';

describe('PayrollPolicyService', () => {
  let service: PayrollPolicyService;

  beforeEach(() => {
    service = new PayrollPolicyService();
  });

  it('allows the normal payroll period workflow', () => {
    expect(() => service.assertPeriodTransition(PayrollPeriodStatus.DRAFT, PayrollPeriodStatus.CALCULATING)).not.toThrow();
    expect(() => service.assertPeriodTransition(PayrollPeriodStatus.CALCULATED, PayrollPeriodStatus.UNDER_REVIEW)).not.toThrow();
    expect(() => service.assertPeriodTransition(PayrollPeriodStatus.UNDER_REVIEW, PayrollPeriodStatus.APPROVED)).not.toThrow();
    expect(() => service.assertPeriodTransition(PayrollPeriodStatus.APPROVED, PayrollPeriodStatus.LOCKED)).not.toThrow();
  });

  it('blocks recalculation after lock', () => {
    expect(() => service.assertPeriodTransition(PayrollPeriodStatus.LOCKED, PayrollPeriodStatus.CALCULATING)).toThrow(
      'Cannot move payroll period from LOCKED to CALCULATING',
    );
  });

  it('calculates overtime with multiplier', () => {
    expect(service.overtimeAmount(100_000, 120, 1.5)).toBe(300_000);
  });
});
