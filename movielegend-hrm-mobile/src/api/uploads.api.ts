import { apiClient, unwrapData } from './client';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { ApiResponse } from '../types/api.types';
import type { UploadFileInput, UploadedFileDto } from '../types/upload.types';
import { getAccessToken } from '../storage/secure-token.storage';
import { assertApiUrl } from '../constants/env';

export async function uploadFile(input: UploadFileInput): Promise<UploadedFileDto> {
  const formData = new FormData();
  formData.append('purpose', input.purpose);

  if (Platform.OS === 'web') {
    const fileBlob = await fetch(input.uri).then(r => r.blob());
    formData.append('file', fileBlob, input.name);
  } else {
    // In React Native, FormData accepts an object with uri, name, and type for files
    formData.append('file', {
      uri: input.uri,
      name: input.name,
      type: input.mimeType || 'image/jpeg',
    } as any);
  }

  const response = await apiClient.post<ApiResponse<UploadedFileDto>>('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return unwrapData(response);
}
