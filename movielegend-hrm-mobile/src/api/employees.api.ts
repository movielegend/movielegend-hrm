import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { EmployeeListFilters, EmployeeProfile, EmployeeUser, ScopedEmployee, ScopedEmployeeFilters, UpdateEmployeePayload } from '../types/employee.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';

export async function getEmployees(filters: EmployeeListFilters): Promise<PaginatedResult<EmployeeUser>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<EmployeeUser>>>('/admin/users', {
    params: filters,
  });
  return unwrapData(response);
}

export async function getAdminUser(id: string): Promise<EmployeeUser> {
  const response = await apiClient.get<ApiResponse<EmployeeUser>>(`/admin/users/${id}`);
  return unwrapData(response);
}

export async function getEmployeeProfile(profileId: string): Promise<EmployeeProfile> {
  const response = await apiClient.get<ApiResponse<EmployeeProfile>>(`/employees/${profileId}`);
  return unwrapData(response);
}

export async function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<EmployeeUser> {
  const response = await apiClient.patch<ApiResponse<EmployeeUser>>(`/admin/users/${id}`, payload);
  return unwrapData(response);
}

export async function createEmployee(payload: Record<string, any>): Promise<EmployeeUser> {
  const response = await apiClient.post<ApiResponse<EmployeeUser>>(`/admin/users`, payload);
  return unwrapData(response);
}

export async function deleteAdminUser(id: string): Promise<unknown> {
  const response = await apiClient.delete<ApiResponse<unknown>>(`/employees/${id}`);
  return unwrapData(response);
}

export interface EmployeeReportRow {
  userCode?: string;
  fullName?: string;
  department?: string;
  position?: string;
  joinDate?: string;
  employmentStatus?: string;
  accountStatus?: string;
}

export async function getEmployeeReport(filters: EmployeeListFilters): Promise<PaginatedResult<EmployeeReportRow>> {
  const response = await apiClient.get<ApiResponse<EmployeeReportRow[]>>('/reports/employees', { params: filters });
  return normalizePagination(unwrapData(response), cleanPaginationFallback(filters));
}

export async function getScopedEmployees(filters: ScopedEmployeeFilters): Promise<PaginatedResult<ScopedEmployee>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<ScopedEmployee>>>('/employees/scoped', { params: filters });
  return unwrapData(response);
}

function cleanPaginationFallback(filters: EmployeeListFilters): { page?: number; limit?: number } {
  return {
    ...(typeof filters.page === 'number' ? { page: filters.page } : {}),
    ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
  };
}
