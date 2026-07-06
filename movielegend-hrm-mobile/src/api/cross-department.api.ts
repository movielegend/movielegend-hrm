import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type {
  CreateCrossDepartmentRequestPayload,
  CrossDepartmentRequestDto,
  RejectCrossDepartmentRequestPayload,
} from '../types/cross-department.types';

export async function getCrossDepartmentRequests(filters: { page?: number; limit?: number; status?: string } = {}): Promise<PaginatedResult<CrossDepartmentRequestDto>> {
  const response = await apiClient.get<ApiResponse<CrossDepartmentRequestDto[] | { items: CrossDepartmentRequestDto[] }>>('/cross-department-requests', {
    params: filters,
  });
  return normalizePagination(unwrapData(response), filters);
}

export async function getCrossDepartmentRequest(id: string): Promise<CrossDepartmentRequestDto> {
  const response = await apiClient.get<ApiResponse<CrossDepartmentRequestDto>>(`/cross-department-requests/${id}`);
  return unwrapData(response);
}

export async function createCrossDepartmentRequest(payload: CreateCrossDepartmentRequestPayload): Promise<CrossDepartmentRequestDto> {
  const response = await apiClient.post<ApiResponse<CrossDepartmentRequestDto>>('/cross-department-requests', payload);
  return unwrapData(response);
}

export async function sourceApproveCrossDepartmentRequest(id: string): Promise<CrossDepartmentRequestDto> {
  const response = await apiClient.patch<ApiResponse<CrossDepartmentRequestDto>>(`/cross-department-requests/${id}/source-approve`);
  return unwrapData(response);
}

export async function sourceRejectCrossDepartmentRequest(id: string, payload: RejectCrossDepartmentRequestPayload): Promise<CrossDepartmentRequestDto> {
  const response = await apiClient.patch<ApiResponse<CrossDepartmentRequestDto>>(`/cross-department-requests/${id}/source-reject`, payload);
  return unwrapData(response);
}

export async function targetAcceptCrossDepartmentRequest(id: string): Promise<CrossDepartmentRequestDto> {
  const response = await apiClient.patch<ApiResponse<CrossDepartmentRequestDto>>(`/cross-department-requests/${id}/target-accept`);
  return unwrapData(response);
}

export async function targetRejectCrossDepartmentRequest(id: string, payload: RejectCrossDepartmentRequestPayload): Promise<CrossDepartmentRequestDto> {
  const response = await apiClient.patch<ApiResponse<CrossDepartmentRequestDto>>(`/cross-department-requests/${id}/target-reject`, payload);
  return unwrapData(response);
}
