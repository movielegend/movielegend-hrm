import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { AssetAssignmentDto, AssignAssetPayload, ReceiveReturnPayload } from '../types/asset-assignment.types';

export async function assignAsset(assetId: string, payload: AssignAssetPayload): Promise<AssetAssignmentDto> {
  const response = await apiClient.post<ApiResponse<AssetAssignmentDto>>(`/assets/${assetId}/assign`, payload);
  return unwrapData(response);
}

export async function confirmAssetAssignment(assignmentId: string): Promise<AssetAssignmentDto> {
  const response = await apiClient.post<ApiResponse<AssetAssignmentDto>>(`/asset-assignments/${assignmentId}/confirm`);
  return unwrapData(response);
}

// Backend không nhận body cho request-return (reason không có trong contract).
export async function requestAssetReturn(assignmentId: string): Promise<AssetAssignmentDto> {
  const response = await apiClient.post<ApiResponse<AssetAssignmentDto>>(`/asset-assignments/${assignmentId}/request-return`);
  return unwrapData(response);
}

export async function receiveAssetReturn(assignmentId: string, payload: ReceiveReturnPayload): Promise<AssetAssignmentDto> {
  const response = await apiClient.post<ApiResponse<AssetAssignmentDto>>(`/asset-assignments/${assignmentId}/receive-return`, payload);
  return unwrapData(response);
}
