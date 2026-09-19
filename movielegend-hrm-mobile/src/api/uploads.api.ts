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
  const effectiveMime = targetMimeType || mimeByExt[ext] || 'application/octet-stream';

  if (Platform.OS !== 'web') {
    // 1. Copy sang FileSystem.cacheDirectory để tránh lỗi scoped permissions "Location isn't readable" trên Android
    let safeUri = targetUri;
    if (FileSystem.cacheDirectory && !targetUri.includes(FileSystem.cacheDirectory)) {
      try {
        const cleanFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
        const destUri = `${FileSystem.cacheDirectory}${cleanFileName}`;
        await FileSystem.copyAsync({
          from: targetUri,
          to: destUri,
        });
        safeUri = destUri;
      } catch (copyErr) {
        console.warn('FileSystem.copyAsync failed, will attempt upload with targetUri:', copyErr);
      }
    }

    // 2. Thử uploadAsync
    try {
      const uploadResult = await FileSystem.uploadAsync(endpoint, safeUri, {
        httpMethod: 'POST',
        uploadType: (FileSystem as any).FileSystemUploadType?.MULTIPART ?? 0,
        fieldName: 'file',
        mimeType: effectiveMime,
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
    } catch (uploadAsyncErr: any) {
      // 3. Fallback: Native React Native FormData fetch
      const formData = new FormData();
      formData.append('purpose', input.purpose);
      
      const formUri = safeUri.startsWith('content://') || safeUri.startsWith('file://')
        ? safeUri
        : (Platform.OS === 'android' ? safeUri : `file://${safeUri}`);

      formData.append('file', {
        uri: formUri,
        name: input.name,
        type: effectiveMime,
      } as any);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
        signal: input.signal,
      });

      let json: any = {};
      try {
        json = await response.json();
      } catch (parseErr) {
        throw new Error(`Upload failed (Status ${response.status})`);
      }
      if (response.ok && json.success) return json.data;
      throw new Error(json.error?.message || json.message || `Upload failed with status ${response.status}`);
    }
  } else {
    const formData = new FormData();
    formData.append('purpose', input.purpose);
    const fileBlob = await fetch(input.uri).then(r => r.blob());
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
    throw new Error(json.error?.message || json.message || 'Upload failed');
  }
}
