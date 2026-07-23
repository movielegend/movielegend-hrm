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

// Backend yêu cầu reason qua RequestReturnPayload
export async function requestAssetReturn(assignmentId: string, payload: { reason: string }): Promise<AssetAssignmentDto> {
  const response = await apiClient.post<ApiResponse<AssetAssignmentDto>>(`/asset-assignments/${assignmentId}/request-return`, payload);
  return unwrapData(response);
}

export async function receiveAssetReturn(assignmentId: string, payload: ReceiveReturnPayload): Promise<AssetAssignmentDto> {
  const response = await apiClient.post<ApiResponse<AssetAssignmentDto>>(`/asset-assignments/${assignmentId}/receive-return`, payload);
  return unwrapData(response);
}
