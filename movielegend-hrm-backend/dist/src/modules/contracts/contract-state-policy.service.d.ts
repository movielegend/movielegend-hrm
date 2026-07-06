import { ContractStatus } from '@prisma/client';
export declare class ContractStatePolicy {
    private readonly transitions;
    assertTransition(from: ContractStatus, to: ContractStatus): void;
}
