import { Prisma, UploadPurpose } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
export declare class UploadsService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
    uploadFromRequest(request: Request, actor?: AuthenticatedUser): Promise<{
        fileId: string;
        fileUrl: string;
        mimeType: string;
        size: number;
        purpose: import("@prisma/client").$Enums.UploadPurpose;
    }>;
    attachTemporaryFiles(fileIds: string[], ownerUserId: string, purpose: UploadPurpose, tx?: Prisma.TransactionClient): Promise<void>;
    cleanupExpiredTemporaryFiles(olderThan: Date): Promise<{
        deleted: number;
    }>;
}
