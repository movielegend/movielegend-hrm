import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { CreateMaterialIssuePayload, MaterialIssueDto, RejectPayload } from '../types/stock.types';

export async function getMaterialIssues(): Promise<PaginatedResult<MaterialIssueDto>> {
  const response = await apiClient.get<ApiResponse<MaterialIssueDto[]>>('/material-issues');
  return normalizePagination(unwrapData(response));
}

export async function getMaterialIssue(id: string): Promise<MaterialIssueDto> {
  const response = await apiClient.get<ApiResponse<MaterialIssueDto>>(`/material-issues/${id}`);
  return unwrapData(response);
}

export async function createMaterialIssue(payload: CreateMaterialIssuePayload): Promise<MaterialIssueDto> {
  const response = await apiClient.post<ApiResponse<MaterialIssueDto>>('/material-issues', payload);
  return unwrapData(response);
}

export async function approveMaterialIssue(id: string): Promise<MaterialIssueDto> {
  const response = await apiClient.post<ApiResponse<MaterialIssueDto>>(`/material-issues/${id}/approve`);
  return unwrapData(response);
}

export async function rejectMaterialIssue(id: string, payload: RejectPayload = {}): Promise<MaterialIssueDto> {
  const response = await apiClient.post<ApiResponse<MaterialIssueDto>>(`/material-issues/${id}/reject`, payload);
  return unwrapData(response);
}

export async function issueMaterials(id: string): Promise<MaterialIssueDto> {
  const response = await apiClient.post<ApiResponse<MaterialIssueDto>>(`/material-issues/${id}/issue`);
  return unwrapData(response);
}

export async function cancelMaterialIssue(id: string): Promise<MaterialIssueDto> {
  const response = await apiClient.post<ApiResponse<MaterialIssueDto>>(`/material-issues/${id}/cancel`);
  return unwrapData(response);
}
