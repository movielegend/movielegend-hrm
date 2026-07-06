import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type {
  AssetCategoryDto,
  AssetDto,
  CreateAssetCategoryPayload,
  CreateAssetPayload,
  UpdateAssetPayload,
} from '../types/asset.types';
import type { MyAssetAssignmentDto } from '../types/asset-assignment.types';

export async function getAssets(): Promise<PaginatedResult<AssetDto>> {
  const response = await apiClient.get<ApiResponse<AssetDto[]>>('/assets');
  return normalizePagination(unwrapData(response));
}

export async function getMyAssets(): Promise<PaginatedResult<MyAssetAssignmentDto>> {
  const response = await apiClient.get<ApiResponse<MyAssetAssignmentDto[]>>('/assets/my');
  return normalizePagination(unwrapData(response));
}

export async function getAsset(id: string): Promise<AssetDto> {
  const response = await apiClient.get<ApiResponse<AssetDto>>(`/assets/${id}`);
  return unwrapData(response);
}

export async function createAsset(payload: CreateAssetPayload): Promise<AssetDto> {
  const response = await apiClient.post<ApiResponse<AssetDto>>('/assets', payload);
  return unwrapData(response);
}

export async function updateAsset(id: string, payload: UpdateAssetPayload): Promise<AssetDto> {
  const response = await apiClient.patch<ApiResponse<AssetDto>>(`/assets/${id}`, payload);
  return unwrapData(response);
}

// Backend chỉ có POST /asset-categories, KHÔNG có GET (blocker B1).
export async function createAssetCategory(payload: CreateAssetCategoryPayload): Promise<AssetCategoryDto> {
  const response = await apiClient.post<ApiResponse<AssetCategoryDto>>('/asset-categories', payload);
  return unwrapData(response);
}
