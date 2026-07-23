import { Injectable } from '@nestjs/common';
import { ContractStatus } from '@prisma/client';
import { badRequest } from '../../common/utils/error.util';

@Injectable()
export class ContractStatePolicy {
  private readonly transitions: Record<ContractStatus, ContractStatus[]> = {
    DRAFT: [ContractStatus.PENDING_INTERNAL_APPROVAL, ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.EMPLOYEE_SIGNED, ContractStatus.CANCELLED],
    PENDING_INTERNAL_APPROVAL: [ContractStatus.APPROVED, ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.EMPLOYEE_SIGNED, ContractStatus.CANCELLED],
    APPROVED: [ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.EMPLOYEE_SIGNED, ContractStatus.CANCELLED],
    WAITING_EMPLOYEE_SIGNATURE: [ContractStatus.EMPLOYEE_SIGNED, ContractStatus.CANCELLED, ContractStatus.REJECTED],
    EMPLOYEE_SIGNED: [ContractStatus.WAITING_COMPANY_SIGNATURE],
    WAITING_COMPANY_SIGNATURE: [ContractStatus.COMPLETED, ContractStatus.CANCELLED],
    COMPLETED: [ContractStatus.ACTIVE],
    ACTIVE: [ContractStatus.EXPIRED, ContractStatus.TERMINATED],
    EXPIRED: [],
    TERMINATED: [],
    CANCELLED: [],
    REJECTED: [],
  };

  assertTransition(from: ContractStatus, to: ContractStatus): void {
    if (!this.transitions[from].includes(to)) {
      throw badRequest('CONTRACT_STATE_SKIP_DENIED', `Cannot transition contract from ${from} to ${to}`);
    }
  }

  assertCanUpdate(actor: any): void {
    if (!actor.roles?.includes('ADMIN') && !actor.roles?.includes('HR')) {
      throw badRequest('CONTRACT_UPDATE_DENIED', 'Only HR or Admin can update contract templates');
    }
  }
}
