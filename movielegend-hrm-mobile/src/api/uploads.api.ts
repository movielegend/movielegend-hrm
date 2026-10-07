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

function uploadWithXHR(
  endpoint: string,
  safeUri: string,
  fileName: string,
  mimeType: string,
  purpose: string,
  headers: Record<string, string>,
  signal?: AbortSignal
): Promise<UploadedFileDto> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    Object.entries(headers).forEach(([k, v]) => {
      xhr.setRequestHeader(k, v);
    });

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Yêu cầu tải lên đã bị hủy'));
      });
    }

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          resolve(json.data);
        } else {
          reject(new Error(json.error?.message || json.message || `Tải file thất bại với mã lỗi ${xhr.status}`));
        }
      } catch {
        reject(new Error(`Máy chủ phản hồi lỗi (${xhr.status}): ${xhr.responseText.slice(0, 100)}`));
      }
    };

    xhr.onerror = (e) => {
      console.warn('[uploadFile] XHR network error:', e);
      reject(new Error('Lỗi kết nối mạng khi tải ảnh lên máy chủ'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Hết thời gian chờ kết nối khi tải ảnh'));
    };

    const formData = new FormData();
    formData.append('purpose', purpose);
    formData.append('file', {
      uri: safeUri,
      name: fileName,
      type: mimeType,
    } as any);

    xhr.send(formData);
  });
}

  if (Platform.OS === 'web') {
    const formData = new FormData();
    formData.append('purpose', input.purpose);
    const fileBlob = await fetch(input.uri).then((r) => r.blob());
    const safeFile = new File([fileBlob], input.name || 'upload.jpg', { type: effectiveMime });
    formData.append('file', safeFile);

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
  }

  // Trên Mobile (iOS / Android):
  // React Native 0.86 / Hermes dùng C++ fetch mới sẽ báo lỗi 'Unsupported FormDataPart implementation'
  // khi fetch(formData) với { uri, name, type }.
  // Vì vậy: ưu tiên FileSystem.uploadAsync của Expo, và fallback XMLHttpRequest.
  let uploadError: any = null;

  if (typeof FileSystem?.uploadAsync === 'function') {
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
        throw new Error(json.error?.message || json.message || 'Tải file thất bại');
      } else {
        let errMessage = `Tải file thất bại (${uploadResult.status})`;
        try {
          const json = JSON.parse(uploadResult.body);
          if (json.error?.message) errMessage = json.error.message;
          else if (json.message) errMessage = json.message;
        } catch {}
        throw new Error(errMessage);
      }
    } catch (fsErr: any) {
      uploadError = fsErr;
      console.warn('[uploadFile] FileSystem.uploadAsync error, attempting XHR fallback:', fsErr?.message || fsErr);
      // Nếu server trả về lỗi từ chối rõ ràng (như 400 validation, 401 auth), không cần thử XHR
      if (fsErr?.message && (fsErr.message.includes('400') || fsErr.message.includes('401') || fsErr.message.includes('403'))) {
        throw fsErr;
      }
    }
  }

  // Fallback 2: Thử XMLHttpRequest (Native networking module hỗ trợ multipart { uri, name, type })
  try {
    return await uploadWithXHR(
      endpoint,
      safeUri,
      input.name || `photo_${Date.now()}.jpg`,
      effectiveMime,
      input.purpose,
      headers,
      input.signal
    );
  } catch (xhrErr: any) {
    console.warn('[uploadFile] XHR fallback error:', xhrErr?.message || xhrErr);
    throw uploadError || xhrErr;
  }
}
