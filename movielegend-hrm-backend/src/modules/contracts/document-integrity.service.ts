import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class DocumentIntegrityService {
  sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  hashDocumentReference(fileUrl: string, signatureHash?: string): string {
    return this.sha256(`${fileUrl}:${signatureHash ?? ''}`);
  }
}
