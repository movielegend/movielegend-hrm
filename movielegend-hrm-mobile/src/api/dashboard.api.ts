import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export type DashboardRole = 'ADMIN' | 'LEADER' | 'EMPLOYEE';

export type DashboardData = Record<string, unknown>;

export async function getDashboardByRole(role: DashboardRole): Promise<DashboardData> {
  const path = role === 'ADMIN' ? '/dashboard/admin' : role === 'LEADER' ? '/dashboard/leader' : '/dashboard/me';
  const response = await apiClient.get<ApiResponse<DashboardData>>(path);
  return unwrapData(response);
}
