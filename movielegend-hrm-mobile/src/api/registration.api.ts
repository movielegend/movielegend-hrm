import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { RegisterPayload, RegisterResult } from '../types/registration.types';

export async function registerEmployee(payload: RegisterPayload): Promise<RegisterResult> {
  const response = await apiClient.post<ApiResponse<RegisterResult>>('/auth/register', payload);
  return unwrapData(response);
}
