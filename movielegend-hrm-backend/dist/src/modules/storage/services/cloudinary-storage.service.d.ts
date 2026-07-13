import { StorageService, UploadInput, UploadResult } from '../storage.service';
export declare class CloudinaryStorageService implements StorageService {
    private readonly logger;
    constructor();
    upload(input: UploadInput): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getPublicUrl(key: string): string;
    read(key: string): Promise<Buffer>;
}
