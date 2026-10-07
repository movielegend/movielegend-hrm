import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { UploadFileInput, UploadedFileDto } from '../types/upload.types';
import { getAccessToken } from '../storage/secure-token.storage';
import { assertApiUrl } from '../constants/env';
import { normalizeAndCompressImage } from '../utils/image';

export async function uploadFile(input: UploadFileInput): Promise<UploadedFileDto> {
  const token = await getAccessToken();
  const apiUrl = assertApiUrl();
  const endpoint = `${apiUrl}/uploads`;
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'ngrok-skip-browser-warning': 'true',
  };

  // Normalize and compress image for iOS/Android before uploading
  let targetUri = input.uri;
  let targetMimeType = input.mimeType || 'image/jpeg';
  if (targetMimeType?.startsWith('image/') || input.name?.match(/\.(jpg|jpeg|png|heic|heif|webp)$/i)) {
    try {
      targetUri = await normalizeAndCompressImage(input.uri);
      targetMimeType = 'image/jpeg';
    } catch (compressErr) {
      console.warn('[uploadFile] Image compression error, using raw uri:', compressErr);
    }
  }

  const extMatch = input.name?.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
  const mimeByExt: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.m4a': 'audio/m4a',
    '.aac': 'audio/aac',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
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
  const effectiveMime = targetMimeType || mimeByExt[ext] || 'image/jpeg';

  let safeUri = targetUri;
  if (Platform.OS !== 'web') {
    if (!safeUri.startsWith('content://') && !safeUri.startsWith('file://')) {
      safeUri = safeUri.startsWith('/') ? `file://${safeUri}` : `file:///${safeUri}`;
    }
  }

  // Phương án 1 (Ưu tiên): Dùng Native FormData fetch
  // Chuẩn của React Native, hoạt động trên cả Expo Go, Dev Build và Production
  try {
    const formData = new FormData();
    formData.append('purpose', input.purpose);

    if (Platform.OS === 'web') {
      const fileBlob = await fetch(input.uri).then((r) => r.blob());
      const safeFile = new File([fileBlob], input.name || 'upload.jpg', { type: effectiveMime });
      formData.append('file', safeFile);
    } else {
      formData.append('file', {
        uri: safeUri,
        name: input.name || `photo_${Date.now()}.jpg`,
        type: effectiveMime,
      } as any);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
      signal: input.signal,
    });

    const responseText = await response.text();
    let json: any = {};
    try {
      json = JSON.parse(responseText);
    } catch {
      throw new Error(`Máy chủ phản hồi lỗi (${response.status}): ${responseText.slice(0, 100)}`);
    }

    if (response.ok && json.success) {
      return json.data;
    }
    throw new Error(json.error?.message || json.message || `Tải file thất bại với mã lỗi ${response.status}`);
  } catch (primaryErr: any) {
    console.warn('[uploadFile] FormData fetch error:', primaryErr?.message || primaryErr);

    // Nếu là lỗi server từ chối có mã lỗi / thông báo cụ thể (không phải network), throw luôn
    if (
      primaryErr?.message &&
      !primaryErr.message.includes('Network request failed') &&
      !primaryErr.message.includes('Failed to fetch')
    ) {
      throw primaryErr;
    }

    // Phương án 2 (Fallback cho Android/iOS cũ): Thử FileSystem.uploadAsync nếu có
    if (Platform.OS !== 'web' && typeof FileSystem?.uploadAsync === 'function') {
      try {
        const uploadResult = await FileSystem.uploadAsync(endpoint, safeUri, {
          httpMethod: 'POST',
          uploadType: (FileSystem as any).FileSystemUploadType?.MULTIPART ?? 1,
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
          throw new Error(json.error?.message || json.message || 'Upload failed');
        } else {
          let errMessage = `Upload failed (${uploadResult.status})`;
          try {
            const json = JSON.parse(uploadResult.body);
            if (json.error?.message) errMessage = json.error.message;
            else if (json.message) errMessage = json.message;
          } catch {}
          throw new Error(errMessage);
        }
      } catch (fsErr: any) {
        console.warn('[uploadFile] FileSystem.uploadAsync fallback error:', fsErr?.message || fsErr);
      }
    }

    throw primaryErr;
  }
}
