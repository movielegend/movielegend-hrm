import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { CreateEmployeeRequestPayload, EmployeeRequest, EmployeeRequestFilters } from '../types/request.types';
import type { PaginatedResult } from '../types/pagination.types';

export async function createEmployeeRequest(payload: CreateEmployeeRequestPayload): Promise<EmployeeRequest> {
  const response = await apiClient.post<ApiResponse<EmployeeRequest>>('/employee-requests', payload);
  return unwrapData(response);
}

export async function getEmployeeRequests(filters: EmployeeRequestFilters = {}): Promise<EmployeeRequest[]> {
  const response = await apiClient.get<ApiResponse<EmployeeRequest[]>>('/employee-requests', {
    params: filters,
  });
  return unwrapData(response);
}

export async function getMyEmployeeRequests(filters: EmployeeRequestFilters = {}): Promise<PaginatedResult<EmployeeRequest>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<EmployeeRequest>>>('/employee-requests/my', {
    params: cleanMyRequestParams(filters),
  });
  return unwrapData(response);
}

function cleanMyRequestParams(filters: EmployeeRequestFilters): Omit<EmployeeRequestFilters, 'departmentId'> {
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
    ...(filters.toDate ? { toDate: filters.toDate } : {}),
    ...(typeof filters.page === 'number' ? { page: filters.page } : {}),
    ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
  };
}
