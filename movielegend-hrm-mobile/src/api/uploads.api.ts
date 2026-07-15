import { apiClient, unwrapData } from './client';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/api.types';
import type { UploadFileInput, UploadedFileDto } from '../types/upload.types';

export async function uploadFile(input: UploadFileInput): Promise<UploadedFileDto> {
  const formData = new FormData();
  formData.append('purpose', input.purpose);
  
  let fileBlob: any = input.file;
  
  if (!fileBlob) {
    if (typeof window !== 'undefined' && input.uri.startsWith('blob:')) {
      // On web, fetch the blob from the blob URI
      fileBlob = await fetch(input.uri).then(r => r.blob());
    } else {
      // React Native approach
      fileBlob = {
        uri: input.uri,
        name: input.name,
        type: input.mimeType,
      } as unknown as Blob;
    }
  }

  formData.append('file', fileBlob, input.name);

  const config: AxiosRequestConfig<FormData> = {
    timeout: 30_000,
    onUploadProgress: (event) => {
      const loaded = event.loaded ?? 0;
      const total = event.total ?? undefined;
      input.onProgress?.({
        loaded,
        ...(typeof total === 'number' ? { total } : {}),
        percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
      });
    },
    ...(input.signal ? { signal: input.signal } : {}),
  };

  const response = await apiClient.post<ApiResponse<UploadedFileDto>, AxiosResponse<ApiResponse<UploadedFileDto>>>('/uploads', formData, config);
  return unwrapData(response);
}
