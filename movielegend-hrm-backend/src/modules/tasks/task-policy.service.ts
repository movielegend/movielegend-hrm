import { Injectable } from '@nestjs/common';
import { TaskAssignmentStatus } from '@prisma/client';
import { badRequest } from '../../common/utils/error.util';

@Injectable()
export class TaskPolicyService {
  assertAssignmentTransition(from: TaskAssignmentStatus, to: TaskAssignmentStatus): void {
    const allowed: Record<TaskAssignmentStatus, TaskAssignmentStatus[]> = {
      NEW: [TaskAssignmentStatus.ACCEPTED, TaskAssignmentStatus.CANCELLED],
      ACCEPTED: [TaskAssignmentStatus.IN_PROGRESS, TaskAssignmentStatus.CANCELLED],
      IN_PROGRESS: [TaskAssignmentStatus.WAITING_REVIEW, TaskAssignmentStatus.CANCELLED],
      WAITING_REVIEW: [TaskAssignmentStatus.COMPLETED, TaskAssignmentStatus.REJECTED],
      REJECTED: [TaskAssignmentStatus.IN_PROGRESS, TaskAssignmentStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!allowed[from].includes(to)) {
      throw badRequest('INVALID_TASK_STATUS_TRANSITION', `Cannot move assignment from ${from} to ${to}`);
    }
  }
}
