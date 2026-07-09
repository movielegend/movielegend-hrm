import { DocumentStatus } from '@prisma/client';
export declare class CreateDocumentTypeDto {
    companyId: string;
    code: string;
    name: string;
    description?: string;
    requiresExpiryDate?: boolean;
    requiresDocumentNumber?: boolean;
    allowedMimeTypes?: string[];
    maxFileSize?: number;
}
export declare class UpdateDocumentTypeDto {
    name?: string;
    description?: string;
    requiresExpiryDate?: boolean;
    requiresDocumentNumber?: boolean;
    isActive?: boolean;
}
export declare class CreateEmployeeDocumentDto {
    userId?: string;
    documentTypeId: string;
    documentNumber?: string;
    title: string;
    description?: string;
    issueDate?: string;
    expiryDate?: string;
    issuedBy?: string;
    fileName: string;
    fileUrl: string;
    storageKey?: string;
    mimeType?: string;
    fileSize?: number;
}
export declare class VerifyEmployeeDocumentDto {
    status: DocumentStatus;
    rejectionReason?: string;
}
