import { TaskAssignmentStatus } from '@prisma/client';
export declare class TaskPolicyService {
    assertAssignmentTransition(from: TaskAssignmentStatus, to: TaskAssignmentStatus): void;
}
