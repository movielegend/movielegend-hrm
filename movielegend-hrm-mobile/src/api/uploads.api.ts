import { apiClient, unwrapData } from './client';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { ApiResponse } from '../types/api.types';
import type { UploadFileInput, UploadedFileDto } from '../types/upload.types';

import { normalizeAndCompressImage } from '../utils/image';

export async function uploadFile(input: UploadFileInput): Promise<UploadedFileDto> {
  const token = await import('../storage/secure-token.storage').then(m => m.getAccessToken());
  const apiUrl = await import('../constants/env').then(m => m.assertApiUrl());
  const endpoint = `${apiUrl}/uploads`;
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'ngrok-skip-browser-warning': 'true',
  };

  // Normalize and compress image for iOS/Android before uploading
  let targetUri = input.uri;
  let targetMimeType = input.mimeType;
  if (input.mimeType?.startsWith('image/') || input.name?.match(/\.(jpg|jpeg|png|heic|heif|webp)$/i)) {
    targetUri = await normalizeAndCompressImage(input.uri);
    targetMimeType = 'image/jpeg';
  }

  if (Platform.OS !== 'web') {
    const uploadResult = await FileSystem.uploadAsync(endpoint, targetUri, {
      httpMethod: 'POST',
      uploadType: (FileSystem as any).FileSystemUploadType?.MULTIPART ?? 1,
      fieldName: 'file',
      mimeType: targetMimeType,
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
    
    const extMatch = input.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
    const mimeByExt: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.doc': 'application/msword',
      '.xls': 'application/vnd.ms-excel',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };
    const effectiveMime = targetMimeType || mimeByExt[ext] || fileBlob.type || 'application/octet-stream';
    const safeFile = new File([fileBlob], input.name, { type: effectiveMime });
    formData.append('file', safeFile, input.name);

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
