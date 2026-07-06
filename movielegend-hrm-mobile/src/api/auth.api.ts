import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { AuthUser } from '../types/user.types';
import type { LoginPayload, LoginResponse, LogoutPayload, RefreshResponse } from '../types/auth.types';

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  return unwrapData(response);
}

export async function refreshApi(refreshToken: string): Promise<RefreshResponse> {
  const response = await apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh', { refreshToken });
  return unwrapData(response);
}

export async function logoutApi(payload: LogoutPayload): Promise<void> {
  await apiClient.post<ApiResponse<{ revoked: boolean }>>('/auth/logout', payload);
}

export async function meApi(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return unwrapData(response);
}
