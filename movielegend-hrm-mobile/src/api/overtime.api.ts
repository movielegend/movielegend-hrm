import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { CreateOvertimeRequestPayload, OvertimeRequest, OvertimeRequestFilters } from '../types/overtime.types';
import type { PaginatedResult } from '../types/pagination.types';
import type { RejectRequestPayload } from '../types/leave.types';

export async function createOvertimeRequest(payload: CreateOvertimeRequestPayload): Promise<OvertimeRequest> {
  const response = await apiClient.post<ApiResponse<OvertimeRequest>>('/overtime-requests', payload);
  return unwrapData(response);
}

export async function approveOvertimeRequest(id: string): Promise<OvertimeRequest> {
  const response = await apiClient.post<ApiResponse<OvertimeRequest>>(`/overtime-requests/${id}/approve`);
  return unwrapData(response);
}

export async function getMyOvertimeRequests(filters: OvertimeRequestFilters = {}): Promise<PaginatedResult<OvertimeRequest>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<OvertimeRequest>>>('/overtime/requests/my', {
    params: filters,
  });
  return unwrapData(response);
}

export async function getPendingOvertimeRequests(filters: OvertimeRequestFilters = {}): Promise<PaginatedResult<OvertimeRequest>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<OvertimeRequest>>>('/overtime/requests/pending', {
    params: filters,
  });
  return unwrapData(response);
}

export async function rejectOvertimeRequest(id: string, payload: RejectRequestPayload): Promise<OvertimeRequest> {
  const response = await apiClient.post<ApiResponse<OvertimeRequest>>(`/overtime/requests/${id}/reject`, payload);
  return unwrapData(response);
}
