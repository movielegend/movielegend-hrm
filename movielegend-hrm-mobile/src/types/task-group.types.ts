import type { Department } from './department.types';
import type { TaskUserSummary } from './task.types';

export interface TaskGroupDto {
  id: string;
  departmentId: string;
  name: string;
  description?: string | null;
  createdByUserId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  department?: Department;
  members?: TaskGroupMemberDto[];
}

export interface TaskGroupMemberDto {
  id: string;
  groupId: string;
  userId: string;
  createdAt?: string;
  user?: TaskUserSummary;
}

export interface CreateTaskGroupPayload {
  departmentId: string;
  name: string;
  description?: string;
}

export interface AddTaskGroupMemberPayload {
  userId: string;
}
