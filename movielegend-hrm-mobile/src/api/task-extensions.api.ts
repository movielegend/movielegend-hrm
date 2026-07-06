import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { ReviewTaskPayload, TaskExtensionRequestDto } from '../types/task.types';
export { createTaskExtensionRequest } from './tasks.api';

export async function approveTaskExtension(id: string): Promise<TaskExtensionRequestDto> {
  const response = await apiClient.patch<ApiResponse<TaskExtensionRequestDto>>(`/task-extensions/${id}/approve`);
  return unwrapData(response);
}

export async function rejectTaskExtension(id: string, payload: ReviewTaskPayload): Promise<TaskExtensionRequestDto> {
  const response = await apiClient.patch<ApiResponse<TaskExtensionRequestDto>>(`/task-extensions/${id}/reject`, payload);
  return unwrapData(response);
}
