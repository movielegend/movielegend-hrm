import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { FaceImageInput } from '../types/registration.types';

export interface UpdateFacePayload {
  faceImages: Array<{ pose: FacePose; imageUrl: string; fileId?: string | undefined }>;
}

export async function updateMyFace(payload: UpdateFacePayload): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.patch<ApiResponse<{ success: boolean; message: string }>>('/users/me/face', payload);
  return unwrapData(response);
}
