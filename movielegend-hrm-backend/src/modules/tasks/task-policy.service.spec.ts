import { TaskAssignmentStatus } from '@prisma/client';
import { TaskPolicyService } from './task-policy.service';

describe('TaskPolicyService', () => {
  let service: TaskPolicyService;

  beforeEach(() => {
    service = new TaskPolicyService();
  });

  it('allows the normal assignment flow from new to completed', () => {
    expect(() =>
      service.assertAssignmentTransition(TaskAssignmentStatus.NEW, TaskAssignmentStatus.ACCEPTED),
    ).not.toThrow();
    expect(() =>
      service.assertAssignmentTransition(TaskAssignmentStatus.ACCEPTED, TaskAssignmentStatus.IN_PROGRESS),
    ).not.toThrow();
    expect(() =>
      service.assertAssignmentTransition(TaskAssignmentStatus.IN_PROGRESS, TaskAssignmentStatus.WAITING_REVIEW),
    ).not.toThrow();
    expect(() =>
      service.assertAssignmentTransition(TaskAssignmentStatus.WAITING_REVIEW, TaskAssignmentStatus.COMPLETED),
    ).not.toThrow();
  });

  it('rejects reopening completed assignments', () => {
    expect(() =>
      service.assertAssignmentTransition(TaskAssignmentStatus.COMPLETED, TaskAssignmentStatus.IN_PROGRESS),
    ).toThrow('Cannot move assignment from COMPLETED to IN_PROGRESS');
  });

  it('allows reviewers to send waiting review tasks back for work', () => {
    expect(() =>
      service.assertAssignmentTransition(TaskAssignmentStatus.WAITING_REVIEW, TaskAssignmentStatus.REJECTED),
    ).not.toThrow();
    expect(() =>
      service.assertAssignmentTransition(TaskAssignmentStatus.REJECTED, TaskAssignmentStatus.IN_PROGRESS),
    ).not.toThrow();
  });
});
