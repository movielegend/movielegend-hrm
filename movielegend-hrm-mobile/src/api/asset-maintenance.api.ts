import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { AssetMaintenanceDto, StartMaintenancePayload } from '../types/asset.types';
import type { ReceiveReturnPayload } from '../types/asset-assignment.types';

// Backend KHÔNG có GET list/detail cho maintenance records (blocker B2).
// Chỉ có start (POST /assets/:id/maintenance) và complete (POST /asset-maintenance/:id/complete).

export async function startAssetMaintenance(assetId: string, payload: StartMaintenancePayload): Promise<AssetMaintenanceDto> {
  const response = await apiClient.post<ApiResponse<AssetMaintenanceDto>>(`/assets/${assetId}/maintenance`, payload);
  return unwrapData(response);
}

export async function completeAssetMaintenance(recordId: string, payload: ReceiveReturnPayload): Promise<AssetMaintenanceDto> {
  const response = await apiClient.post<ApiResponse<AssetMaintenanceDto>>(`/asset-maintenance/${recordId}/complete`, payload);
  return unwrapData(response);
}
