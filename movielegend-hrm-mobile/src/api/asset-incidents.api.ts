import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { AssetIncidentDto, ReportIncidentPayload, ResolveIncidentPayload } from '../types/asset-incident.types';

export async function reportAssetIncident(assetId: string, payload: ReportIncidentPayload): Promise<AssetIncidentDto> {
  const response = await apiClient.post<ApiResponse<AssetIncidentDto>>(`/assets/${assetId}/incidents`, payload);
  return unwrapData(response);
}

// Backend trả toàn bộ list, không hỗ trợ query filter (blocker B7) — filter là client-side trên dữ liệu backend trả.
export async function getAssetIncidents(): Promise<PaginatedResult<AssetIncidentDto>> {
  const response = await apiClient.get<ApiResponse<AssetIncidentDto[]>>('/asset-incidents');
  return normalizePagination(unwrapData(response));
}

export async function getAssetIncident(id: string): Promise<AssetIncidentDto> {
  const response = await apiClient.get<ApiResponse<AssetIncidentDto>>(`/asset-incidents/${id}`);
  return unwrapData(response);
}

export async function investigateAssetIncident(id: string): Promise<AssetIncidentDto> {
  const response = await apiClient.post<ApiResponse<AssetIncidentDto>>(`/asset-incidents/${id}/investigate`);
  return unwrapData(response);
}

export async function resolveAssetIncident(id: string, payload: ResolveIncidentPayload): Promise<AssetIncidentDto> {
  const response = await apiClient.post<ApiResponse<AssetIncidentDto>>(`/asset-incidents/${id}/resolve`, payload);
  return unwrapData(response);
}

export async function rejectAssetIncident(id: string, payload: ResolveIncidentPayload): Promise<AssetIncidentDto> {
  const response = await apiClient.post<ApiResponse<AssetIncidentDto>>(`/asset-incidents/${id}/reject`, payload);
  return unwrapData(response);
}
