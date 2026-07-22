import { apiClient, unwrapData } from './client';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { ApiResponse } from '../types/api.types';
import type { UploadFileInput, UploadedFileDto } from '../types/upload.types';

export async function uploadFile(input: UploadFileInput): Promise<UploadedFileDto> {
  const token = await import('../storage/secure-token.storage').then(m => m.getAccessToken());
  const apiUrl = await import('../constants/env').then(m => m.assertApiUrl());
  const endpoint = `${apiUrl}/uploads`;
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'ngrok-skip-browser-warning': 'true',
  };

  if (Platform.OS !== 'web') {
    const uploadResult = await FileSystem.uploadAsync(endpoint, input.uri, {
      httpMethod: 'POST',
      uploadType: (FileSystem as any).FileSystemUploadType?.MULTIPART ?? 1,
      fieldName: 'file',
      mimeType: input.mimeType,
      parameters: {
        purpose: input.purpose,
      },
      headers,
    });
    
    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      const json = JSON.parse(uploadResult.body);
      if (json.success) return json.data;
      throw new Error(json.error?.message || 'Upload failed');
    } else {
      let errMessage = 'Upload failed';
      try {
        const json = JSON.parse(uploadResult.body);
        if (json.error?.message) errMessage = json.error.message;
        else if (json.message) errMessage = json.message;
      } catch (e) {}
      throw new Error(errMessage);
    }
  } else {
    const formData = new FormData();
    formData.append('purpose', input.purpose);
    const fileBlob = await fetch(input.uri).then(r => r.blob());
    formData.append('file', fileBlob, input.name);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
      signal: input.signal,
    });

    const json = await response.json();
    if (json.success) return json.data;
    throw new Error(json.error?.message || 'Upload failed');
  }
}
