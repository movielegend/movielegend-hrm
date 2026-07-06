import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { ApprovalFilters, ApprovalRequest, RejectApprovalPayload } from '../types/approval.types';
import type { PaginatedResult } from '../types/pagination.types';

export async function getApprovals(filters: ApprovalFilters): Promise<PaginatedResult<ApprovalRequest>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<ApprovalRequest>>>('/approvals/accounts', {
    params: filters,
  });
  return unwrapData(response);
}

export async function approveAccount(id: string): Promise<{ id: string; status: string }> {
  const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(`/approvals/accounts/${id}/approve`);
  return unwrapData(response);
}

export async function rejectAccount(id: string, payload: RejectApprovalPayload): Promise<{ id: string; status: string }> {
  const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(`/approvals/accounts/${id}/reject`, payload);
  return unwrapData(response);
}
