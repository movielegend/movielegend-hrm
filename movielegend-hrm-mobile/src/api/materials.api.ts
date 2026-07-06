import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type {
  CreateMaterialCategoryPayload,
  CreateMaterialPayload,
  MaterialCategoryDto,
  MaterialDto,
  UpdateMaterialPayload,
} from '../types/material.types';

export async function getMaterialCategories(): Promise<PaginatedResult<MaterialCategoryDto>> {
  const response = await apiClient.get<ApiResponse<MaterialCategoryDto[]>>('/material-categories');
  return normalizePagination(unwrapData(response));
}

export async function createMaterialCategory(payload: CreateMaterialCategoryPayload): Promise<MaterialCategoryDto> {
  const response = await apiClient.post<ApiResponse<MaterialCategoryDto>>('/material-categories', payload);
  return unwrapData(response);
}

export async function getMaterials(): Promise<PaginatedResult<MaterialDto>> {
  const response = await apiClient.get<ApiResponse<MaterialDto[]>>('/materials');
  return normalizePagination(unwrapData(response));
}

export async function getMaterial(id: string): Promise<MaterialDto> {
  const response = await apiClient.get<ApiResponse<MaterialDto>>(`/materials/${id}`);
  return unwrapData(response);
}

export async function createMaterial(payload: CreateMaterialPayload): Promise<MaterialDto> {
  const response = await apiClient.post<ApiResponse<MaterialDto>>('/materials', payload);
  return unwrapData(response);
}

export async function updateMaterial(id: string, payload: UpdateMaterialPayload): Promise<MaterialDto> {
  const response = await apiClient.patch<ApiResponse<MaterialDto>>(`/materials/${id}`, payload);
  return unwrapData(response);
}
