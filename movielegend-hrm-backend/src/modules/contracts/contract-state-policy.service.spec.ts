import { ContractStatus } from '@prisma/client';
import { ContractStatePolicy } from './contract-state-policy.service';

describe('ContractStatePolicy', () => {
  const policy = new ContractStatePolicy();

  it('allows the expected approval and signature flow', () => {
    expect(() => policy.assertTransition(ContractStatus.DRAFT, ContractStatus.PENDING_INTERNAL_APPROVAL)).not.toThrow();
    expect(() => policy.assertTransition(ContractStatus.PENDING_INTERNAL_APPROVAL, ContractStatus.APPROVED)).not.toThrow();
    expect(() => policy.assertTransition(ContractStatus.APPROVED, ContractStatus.WAITING_EMPLOYEE_SIGNATURE)).not.toThrow();
    expect(() => policy.assertTransition(ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.EMPLOYEE_SIGNED)).not.toThrow();
    expect(() => policy.assertTransition(ContractStatus.EMPLOYEE_SIGNED, ContractStatus.WAITING_COMPANY_SIGNATURE)).not.toThrow();
    expect(() => policy.assertTransition(ContractStatus.WAITING_COMPANY_SIGNATURE, ContractStatus.COMPLETED)).not.toThrow();
    expect(() => policy.assertTransition(ContractStatus.COMPLETED, ContractStatus.ACTIVE)).not.toThrow();
  });

  it('denies skipping states', () => {
    expect(() => policy.assertTransition(ContractStatus.DRAFT, ContractStatus.ACTIVE)).toThrow();
    expect(() => policy.assertTransition(ContractStatus.APPROVED, ContractStatus.COMPLETED)).toThrow();
  });
});
