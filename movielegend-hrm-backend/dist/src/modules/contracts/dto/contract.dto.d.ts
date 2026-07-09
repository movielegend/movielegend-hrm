import { ContractType, SignatureType } from '@prisma/client';
export declare class CreateContractTemplateDto {
    companyId: string;
    code: string;
    name: string;
    contractType: ContractType;
    description?: string;
    templateFileUrl: string;
    storageKey?: string;
}
export declare class UpdateContractTemplateDto {
    name?: string;
    description?: string;
    templateFileUrl?: string;
    storageKey?: string;
}
export declare class CreateEmployeeContractDto {
    userId: string;
    contractTemplateId: string;
    contractTemplateVersionId: string;
    contractType: ContractType;
    title: string;
    startDate: string;
    endDate?: string;
    draftFileUrl?: string;
}
export declare class UpdateEmployeeContractDto {
    title?: string;
    startDate?: string;
    endDate?: string;
    draftFileUrl?: string;
}
export declare class RejectContractDto {
    reason?: string;
}
export declare class SignContractDto {
    signatureType: SignatureType;
    signatureImageUrl?: string;
    signatureData?: string;
    signedFileUrl?: string;
    ipAddress?: string;
    deviceInfo?: string;
}
export declare class TerminateContractDto {
    reason: string;
}
