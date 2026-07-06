import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  CreateLeaveRequestPayload,
  LeaveType,
  LeaveRequest,
  LeaveRequestFilters,
  RejectRequestPayload,
} from '../types/leave.types';

export async function getLeaveRequests(filters: LeaveRequestFilters = {}): Promise<LeaveRequest[]> {
  const response = await apiClient.get<ApiResponse<LeaveRequest[]>>('/leave-requests', {
    params: filters,
  });
  return unwrapData(response);
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const response = await apiClient.get<ApiResponse<LeaveType[]>>('/leave/types');
  return unwrapData(response);
}

export async function createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
  const response = await apiClient.post<ApiResponse<LeaveRequest>>('/leave-requests', payload);
  return unwrapData(response);
}

export async function approveLeaveRequest(id: string): Promise<LeaveRequest> {
  const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/approve`);
  return unwrapData(response);
}

export async function rejectLeaveRequest(id: string, payload: RejectRequestPayload): Promise<LeaveRequest> {
  const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/reject`, payload);
  return unwrapData(response);
}
