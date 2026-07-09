import { Request } from 'express';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UploadsService } from './uploads.service';
interface UploadRequest extends Request {
    user?: AuthenticatedUser;
}
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    upload(request: UploadRequest): Promise<{
        fileId: string;
        fileUrl: string;
        mimeType: string;
        size: number;
        purpose: import("@prisma/client").$Enums.UploadPurpose;
    }>;
}
export {};
