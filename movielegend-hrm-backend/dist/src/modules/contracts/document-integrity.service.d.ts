export declare class DocumentIntegrityService {
    sha256(value: string): string;
    hashDocumentReference(fileUrl: string, signatureHash?: string): string;
}
