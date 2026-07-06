import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { DeviceTokenDto, RegisterDeviceTokenPayload } from '../types/notification.types';

export async function registerDeviceToken(payload: RegisterDeviceTokenPayload): Promise<DeviceTokenDto> {
  const response = await apiClient.post<ApiResponse<DeviceTokenDto>>('/notifications/device-tokens', payload);
  return unwrapData(response);
}

export async function revokeDeviceToken(id: string): Promise<{ count: number }> {
  const response = await apiClient.delete<ApiResponse<{ count: number }>>(`/notifications/device-tokens/${id}`);
  return unwrapData(response);
}
