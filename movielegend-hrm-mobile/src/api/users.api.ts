import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { FaceImageInput, FacePose } from '../types/registration.types';

export interface UpdateFacePayload {
  faceImages: Array<{ pose: FacePose; imageUrl: string; fileId?: string | undefined }>;
}

export async function updateMyFace(payload: UpdateFacePayload): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.patch<ApiResponse<{ success: boolean; message: string }>>('/users/me/face', payload);
  return unwrapData(response);
}

export interface ValidateFacePosePayload {
  imageBase64?: string;
  fileId?: string;
  imageUrl?: string;
  pose: FacePose;
}

export interface ValidateFacePoseResult {
  valid: boolean;
  detectedPose?: string;
  error?: string;
  message?: string;
}

export async function validateFacePose(payload: ValidateFacePosePayload): Promise<ValidateFacePoseResult> {
  const response = await apiClient.post<ApiResponse<ValidateFacePoseResult>>('/users/me/face/validate-pose', payload);
  return unwrapData(response);
}

export interface UpdateMePayload {
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
}

export async function updateMe(payload: UpdateMePayload): Promise<any> {
  const response = await apiClient.patch<ApiResponse<any>>('/users/me', payload);
  return unwrapData(response);
}
