import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { CreateWarehousePayload, UpdateWarehousePayload, WarehouseDto } from '../types/warehouse.types';

export async function getWarehouses(): Promise<PaginatedResult<WarehouseDto>> {
  const response = await apiClient.get<ApiResponse<WarehouseDto[]>>('/warehouses');
  return normalizePagination(unwrapData(response));
}

export async function getWarehouse(id: string): Promise<WarehouseDto> {
  const response = await apiClient.get<ApiResponse<WarehouseDto>>(`/warehouses/${id}`);
  return unwrapData(response);
}

export async function createWarehouse(payload: CreateWarehousePayload): Promise<WarehouseDto> {
  const response = await apiClient.post<ApiResponse<WarehouseDto>>('/warehouses', payload);
  return unwrapData(response);
}

export async function updateWarehouse(id: string, payload: UpdateWarehousePayload): Promise<WarehouseDto> {
  const response = await apiClient.patch<ApiResponse<WarehouseDto>>(`/warehouses/${id}`, payload);
  return unwrapData(response);
}

export async function closeWarehouse(id: string): Promise<WarehouseDto> {
  const response = await apiClient.delete<ApiResponse<WarehouseDto>>(`/warehouses/${id}`);
  return unwrapData(response);
}
