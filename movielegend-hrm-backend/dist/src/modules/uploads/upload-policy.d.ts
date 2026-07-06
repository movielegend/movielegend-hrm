import { UploadPurpose } from '@prisma/client';
export interface UploadPolicy {
    purpose: UploadPurpose;
    maxSize: number;
    mimeTypes: string[];
    extensions: string[];
}
export declare const uploadPolicies: Record<UploadPurpose, UploadPolicy>;
export declare const maxUploadSize: number;
