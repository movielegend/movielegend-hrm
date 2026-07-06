import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type {
  CreateInventoryCheckPayload,
  InventoryCheckDto,
  UpdateInventoryCheckItemsPayload,
} from '../types/inventory-check.types';

export async function getInventoryChecks(): Promise<PaginatedResult<InventoryCheckDto>> {
  const response = await apiClient.get<ApiResponse<InventoryCheckDto[]>>('/inventory-checks');
  return normalizePagination(unwrapData(response));
}

export async function getInventoryCheck(id: string): Promise<InventoryCheckDto> {
  const response = await apiClient.get<ApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}`);
  return unwrapData(response);
}

export async function createInventoryCheck(payload: CreateInventoryCheckPayload): Promise<InventoryCheckDto> {
  const response = await apiClient.post<ApiResponse<InventoryCheckDto>>('/inventory-checks', payload);
  return unwrapData(response);
}

export async function updateInventoryCheckItems(id: string, payload: UpdateInventoryCheckItemsPayload): Promise<InventoryCheckDto> {
  const response = await apiClient.patch<ApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}/items`, payload);
  return unwrapData(response);
}

export async function submitInventoryCheck(id: string): Promise<InventoryCheckDto> {
  const response = await apiClient.post<ApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}/submit`);
  return unwrapData(response);
}

export async function approveInventoryCheck(id: string): Promise<InventoryCheckDto> {
  const response = await apiClient.post<ApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}/approve`);
  return unwrapData(response);
}
