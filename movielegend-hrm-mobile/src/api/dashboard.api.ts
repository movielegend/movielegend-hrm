import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export type DashboardRole = 'ADMIN' | 'LEADER' | 'EMPLOYEE';

export type DashboardData = Record<string, unknown>;

export async function getDashboardByRole(role: DashboardRole): Promise<DashboardData> {
  const path = role === 'ADMIN' ? '/dashboard/admin' : role === 'LEADER' ? '/dashboard/leader' : '/dashboard/me';
  const response = await apiClient.get<ApiResponse<DashboardData>>(path);
  return unwrapData(response);
}

export interface LeaderActivity {
  id: string;
  title: string;
  time: string;
  icon: string;
  color: string;
  rawAction: string;
  entityType: string;
}

export async function getLeaderActivities(): Promise<LeaderActivity[]> {
  const response = await apiClient.get<ApiResponse<LeaderActivity[]>>('/dashboard/leader/activities');
  return unwrapData(response);
}

export async function getAdminActivities(): Promise<LeaderActivity[]> {
  const response = await apiClient.get<ApiResponse<LeaderActivity[]>>('/dashboard/admin/activities');
  return unwrapData(response);
}
