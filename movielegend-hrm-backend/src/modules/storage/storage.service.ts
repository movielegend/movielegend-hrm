export interface UploadInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  storageKey?: string;
}

export interface UploadResult {
  storageKey: string;
  fileUrl: string;
}

export abstract class StorageService {
  abstract upload(input: UploadInput): Promise<UploadResult>;
  abstract delete(key: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract getPublicUrl(key: string): string;
  abstract read(key: string): Promise<Buffer>;
}
