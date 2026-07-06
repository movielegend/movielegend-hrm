import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { NotificationTargetDto } from '../types/notification.types';

export async function getMyNotifications(): Promise<NotificationTargetDto[]> {
  const response = await apiClient.get<ApiResponse<NotificationTargetDto[]>>('/notifications/me');
  return unwrapData(response);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<number>>('/notifications/unread-count');
  return unwrapData(response);
}

export async function markNotificationRead(id: string): Promise<NotificationTargetDto> {
  const response = await apiClient.patch<ApiResponse<NotificationTargetDto>>(`/notifications/${id}/read`);
  return unwrapData(response);
}

export async function markAllNotificationsRead(): Promise<{ count: number }> {
  const response = await apiClient.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
  return unwrapData(response);
}
