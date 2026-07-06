import { Injectable } from '@nestjs/common';
import { ContractStatus } from '@prisma/client';
import { badRequest } from '../../common/utils/error.util';

@Injectable()
export class ContractStatePolicy {
  private readonly transitions: Record<ContractStatus, ContractStatus[]> = {
    DRAFT: [ContractStatus.PENDING_INTERNAL_APPROVAL, ContractStatus.CANCELLED],
    PENDING_INTERNAL_APPROVAL: [ContractStatus.APPROVED, ContractStatus.CANCELLED],
    APPROVED: [ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.CANCELLED],
    WAITING_EMPLOYEE_SIGNATURE: [ContractStatus.EMPLOYEE_SIGNED, ContractStatus.CANCELLED],
    EMPLOYEE_SIGNED: [ContractStatus.WAITING_COMPANY_SIGNATURE],
    WAITING_COMPANY_SIGNATURE: [ContractStatus.COMPLETED, ContractStatus.CANCELLED],
    COMPLETED: [ContractStatus.ACTIVE],
    ACTIVE: [ContractStatus.EXPIRED, ContractStatus.TERMINATED],
    EXPIRED: [],
    TERMINATED: [],
    CANCELLED: [],
  };

  assertTransition(from: ContractStatus, to: ContractStatus): void {
    if (!this.transitions[from].includes(to)) {
      throw badRequest('CONTRACT_STATE_SKIP_DENIED', `Cannot transition contract from ${from} to ${to}`);
    }
  }
}
