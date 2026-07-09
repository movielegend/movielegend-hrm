import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { CreateDepartmentPayload, Department, UpdateDepartmentPayload } from '../types/department.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';

export interface DepartmentFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getDepartments(filters: DepartmentFilters = {}): Promise<PaginatedResult<Department>> {
  const response = await apiClient.get<ApiResponse<{ items: Department[] } | Department[]>>('/departments', {
    params: { search: filters.search },
  });
  return normalizePagination(unwrapData(response), cleanPaginationFallback(filters));
}

export async function getPublicDepartments(filters: DepartmentFilters = {}): Promise<PaginatedResult<Department>> {
  const response = await apiClient.get<ApiResponse<{ items: Department[] } | Department[]>>('/departments/public', {
    params: { search: filters.search },
  });
  return normalizePagination(unwrapData(response), cleanPaginationFallback(filters));
}

function cleanPaginationFallback(filters: DepartmentFilters): { page?: number; limit?: number } {
  return {
    ...(typeof filters.page === 'number' ? { page: filters.page } : {}),
    ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
  };
}

export async function getDepartment(id: string): Promise<Department> {
  const response = await apiClient.get<ApiResponse<Department>>(`/departments/${id}`);
  return unwrapData(response);
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
  const response = await apiClient.post<ApiResponse<Department>>('/departments', payload);
  return unwrapData(response);
}

export async function updateDepartment(id: string, payload: UpdateDepartmentPayload): Promise<Department> {
  const response = await apiClient.patch<ApiResponse<Department>>(`/departments/${id}`, payload);
  return unwrapData(response);
}

export async function deleteDepartment(id: string): Promise<unknown> {
  const response = await apiClient.delete<ApiResponse<unknown>>(`/departments/${id}`);
  return unwrapData(response);
}
