import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { AuthUser } from '../types/user.types';
import type { LoginPayload, LoginResponse, LogoutPayload, RefreshResponse } from '../types/auth.types';

export interface RequestOtpPayload {
  phone: string;
}
export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}
export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

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

export async function requestOtpApi(payload: RequestOtpPayload): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password/request-otp', payload);
  return unwrapData(response);
}

export async function verifyOtpApi(payload: VerifyOtpPayload): Promise<{ resetToken: string; message: string }> {
  const response = await apiClient.post<ApiResponse<{ resetToken: string; message: string }>>('/auth/forgot-password/verify-otp', payload);
  return unwrapData(response);
}

export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password/reset', payload);
  return unwrapData(response);
}
