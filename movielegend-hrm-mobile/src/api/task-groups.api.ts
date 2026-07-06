import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { AddTaskGroupMemberPayload, CreateTaskGroupPayload, TaskGroupDto, TaskGroupMemberDto } from '../types/task-group.types';

export async function getTaskGroups(filters: { page?: number; limit?: number; departmentId?: string } = {}): Promise<PaginatedResult<TaskGroupDto>> {
  const response = await apiClient.get<ApiResponse<TaskGroupDto[] | { items: TaskGroupDto[] }>>('/task-groups', {
    params: filters,
  });
  return normalizePagination(unwrapData(response), filters);
}

export async function getTaskGroup(id: string): Promise<TaskGroupDto> {
  const response = await apiClient.get<ApiResponse<TaskGroupDto>>(`/task-groups/${id}`);
  return unwrapData(response);
}

export async function createTaskGroup(payload: CreateTaskGroupPayload): Promise<TaskGroupDto> {
  const response = await apiClient.post<ApiResponse<TaskGroupDto>>('/task-groups', payload);
  return unwrapData(response);
}

export async function addTaskGroupMember(id: string, payload: AddTaskGroupMemberPayload): Promise<TaskGroupMemberDto> {
  const response = await apiClient.post<ApiResponse<TaskGroupMemberDto>>(`/task-groups/${id}/members`, payload);
  return unwrapData(response);
}

export async function removeTaskGroupMember(id: string, userId: string): Promise<{ count: number }> {
  const response = await apiClient.delete<ApiResponse<{ count: number }>>(`/task-groups/${id}/members/${userId}`);
  return unwrapData(response);
}
