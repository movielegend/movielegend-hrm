import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface LeaderAssignmentPayload {
  userId: string;
  departmentId: string;
  primary?: boolean;
}

export interface LeaderAssignment {
  id: string;
  userId: string;
  roleId: string;
  scopeType: string;
  scopeId?: string | null;
}

export async function assignLeader(payload: LeaderAssignmentPayload): Promise<LeaderAssignment> {
  const response = await apiClient.post<ApiResponse<LeaderAssignment>>('/admin/leader-assignments', payload);
  return unwrapData(response);
}

export async function revokeLeader(assignmentId: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResponse<boolean>>(`/admin/leader-assignments/${assignmentId}`);
  return unwrapData(response);
}
