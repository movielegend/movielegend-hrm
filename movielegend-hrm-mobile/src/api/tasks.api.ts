import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type {
  CreateTaskAttachmentPayload,
  CreateTaskCommentPayload,
  CreateTaskExtensionPayload,
  CreateTaskPayload,
  TaskAttachmentDto,
  TaskCommentDto,
  TaskDto,
  TaskExtensionPendingFilters,
  TaskExtensionPendingItemDto,
  TaskExtensionRequestDto,
  TaskListFilters,
  TaskReviewQueueFilters,
  TaskReviewQueueItemDto,
  TaskTimelineItemDto,
  UpdateTaskPayload,
} from '../types/task.types';

export async function getTasks(filters: TaskListFilters = {}): Promise<PaginatedResult<TaskDto>> {
  const response = await apiClient.get<ApiResponse<TaskDto[] | { items: TaskDto[] }>>('/tasks', {
    params: filters,
  });
  return normalizePagination(unwrapData(response), filters);
}

export async function getMyTasks(filters: TaskListFilters = {}): Promise<PaginatedResult<TaskDto>> {
  const response = await apiClient.get<ApiResponse<TaskDto[] | { items: TaskDto[] }>>('/tasks/me', {
    params: filters,
  });
  return normalizePagination(unwrapData(response), filters);
}

export async function getTask(id: string): Promise<TaskDto> {
  const response = await apiClient.get<ApiResponse<TaskDto>>(`/tasks/${id}`);
  return unwrapData(response);
}

export async function getTaskTimeline(id: string, filters: { page?: number; limit?: number } = {}): Promise<PaginatedResult<TaskTimelineItemDto>> {
  const response = await apiClient.get<ApiResponse<{ items: TaskTimelineItemDto[] }>>(`/tasks/${id}/timeline`, {
    params: filters,
  });
  return normalizePagination(unwrapData(response), filters);
}

export async function getTaskReviewQueue(filters: TaskReviewQueueFilters = {}): Promise<PaginatedResult<TaskReviewQueueItemDto>> {
  const response = await apiClient.get<ApiResponse<{ items: TaskReviewQueueItemDto[] }>>('/task-assignments/review-queue', {
    params: filters,
  });
  return normalizePagination(unwrapData(response), filters);
}

export async function getPendingTaskExtensions(filters: TaskExtensionPendingFilters = {}): Promise<PaginatedResult<TaskExtensionPendingItemDto>> {
  const response = await apiClient.get<ApiResponse<{ items: TaskExtensionPendingItemDto[] }>>('/task-extensions/pending', {
    params: filters,
  });
  return normalizePagination(unwrapData(response), filters);
}

export async function createTask(payload: CreateTaskPayload): Promise<TaskDto> {
  const response = await apiClient.post<ApiResponse<TaskDto>>('/tasks', payload);
  return unwrapData(response);
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<TaskDto> {
  const response = await apiClient.patch<ApiResponse<TaskDto>>(`/tasks/${id}`, payload);
  return unwrapData(response);
}

export async function cancelTask(id: string): Promise<TaskDto> {
  const response = await apiClient.patch<ApiResponse<TaskDto>>(`/tasks/${id}/cancel`);
  return unwrapData(response);
}

export async function createTaskComment(taskId: string, payload: CreateTaskCommentPayload): Promise<TaskCommentDto> {
  const response = await apiClient.post<ApiResponse<TaskCommentDto>>(`/tasks/${taskId}/comments`, payload);
  return unwrapData(response);
}

export async function createTaskAttachment(taskId: string, payload: CreateTaskAttachmentPayload): Promise<TaskAttachmentDto> {
  const response = await apiClient.post<ApiResponse<TaskAttachmentDto>>(`/tasks/${taskId}/attachments`, payload);
  return unwrapData(response);
}

export async function deleteTaskAttachment(taskId: string, attachmentId: string): Promise<void> {
  const response = await apiClient.delete<ApiResponse<void>>(`/tasks/${taskId}/attachments/${attachmentId}`);
  return unwrapData(response);
}

export async function createTaskExtensionRequest(taskId: string, payload: CreateTaskExtensionPayload): Promise<TaskExtensionRequestDto> {
  const response = await apiClient.post<ApiResponse<TaskExtensionRequestDto>>(`/tasks/${taskId}/extensions`, payload);
  return unwrapData(response);
}

export async function completeTask(id: string): Promise<TaskDto> {
  const response = await apiClient.post<ApiResponse<TaskDto>>('/tasks/' + id + '/complete');
  return unwrapData(response);
}
