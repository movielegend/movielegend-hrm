import { ConfigService } from '@nestjs/config';
import { StorageService, UploadInput, UploadResult } from '../storage.service';
export declare class LocalStorageService extends StorageService {
    private readonly root;
    constructor(config: ConfigService);
    upload(input: UploadInput): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getPublicUrl(key: string): string;
    private resolveKey;
}
