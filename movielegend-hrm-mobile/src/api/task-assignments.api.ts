import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { ReviewTaskPayload, SubmitTaskPayload, TaskAssignmentDto, UpdateTaskProgressPayload } from '../types/task.types';

export async function acceptTaskAssignment(id: string): Promise<TaskAssignmentDto> {
  const response = await apiClient.patch<ApiResponse<TaskAssignmentDto>>(`/task-assignments/${id}/accept`);
  return unwrapData(response);
}

export async function startTaskAssignment(id: string): Promise<TaskAssignmentDto> {
  const response = await apiClient.patch<ApiResponse<TaskAssignmentDto>>(`/task-assignments/${id}/start`);
  return unwrapData(response);
}

export async function updateTaskAssignmentProgress(id: string, payload: UpdateTaskProgressPayload): Promise<TaskAssignmentDto> {
  const response = await apiClient.patch<ApiResponse<TaskAssignmentDto>>(`/task-assignments/${id}/progress`, payload);
  return unwrapData(response);
}

export async function submitTaskAssignment(id: string, payload: SubmitTaskPayload): Promise<TaskAssignmentDto> {
  const response = await apiClient.patch<ApiResponse<TaskAssignmentDto>>(`/task-assignments/${id}/submit`, payload);
  return unwrapData(response);
}

export async function approveTaskAssignment(id: string, payload: ReviewTaskPayload = {}): Promise<TaskAssignmentDto> {
  const response = await apiClient.patch<ApiResponse<TaskAssignmentDto>>(`/task-assignments/${id}/approve`, payload);
  return unwrapData(response);
}

export async function rejectTaskAssignment(id: string, payload: ReviewTaskPayload): Promise<TaskAssignmentDto> {
  const response = await apiClient.patch<ApiResponse<TaskAssignmentDto>>(`/task-assignments/${id}/reject`, payload);
  return unwrapData(response);
}
