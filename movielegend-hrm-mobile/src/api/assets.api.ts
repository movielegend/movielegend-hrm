import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type {
  AssetDto,
  CreateAssetPayload,
  UpdateAssetPayload,
} from '../types/asset.types';
import type { MyAssetAssignmentDto } from '../types/asset-assignment.types';

export async function getAssets(incidentTab?: string): Promise<PaginatedResult<AssetDto>> {
  const params = incidentTab ? { incidentTab } : undefined;
  const response = await apiClient.get<ApiResponse<AssetDto[]>>('/assets', { params });
  return normalizePagination(unwrapData(response));
}

export async function updateIncidentStatus(id: string, status: 'BROKEN' | 'OK', note?: string): Promise<AssetDto> {
  const response = await apiClient.patch<ApiResponse<AssetDto>>(`/assets/${id}/incident-status`, { status, note });
  return unwrapData(response);
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

export async function transferAsset(id: string, payload: { targetDepartmentId: string; note?: string }): Promise<AssetDto> {
  const response = await apiClient.post<ApiResponse<AssetDto>>(`/assets/${id}/transfer`, payload);
  return unwrapData(response);
}

export async function revokeAsset(id: string, payload: { note?: string }): Promise<AssetDto> {
  const response = await apiClient.post<ApiResponse<AssetDto>>(`/assets/${id}/revoke`, payload);
  return unwrapData(response);
}
