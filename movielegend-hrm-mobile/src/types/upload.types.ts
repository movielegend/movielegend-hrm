export type UploadPurpose =
  | 'FACE_REGISTRATION'
  | 'ATTENDANCE'
  | 'TASK_ATTACHMENT'
  | 'EMPLOYEE_DOCUMENT'
  | 'CONTRACT_TEMPLATE'
  | 'SIGNATURE'
  | 'KPI_EVIDENCE'
  | 'ASSET_INCIDENT';

export type UploadStatus = 'IDLE' | 'UPLOADING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface UploadedFileDto {
  fileId: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  purpose: UploadPurpose;
}

export interface UploadProgress {
  loaded: number;
  total?: number;
  percent: number;
}

export interface UploadError {
  code: string;
  message: string;
}

export interface UploadFileInput {
  uri: string;
  name: string;
  mimeType: string;
  purpose: UploadPurpose;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: UploadProgress) => void) | undefined;
  file?: any;
}
