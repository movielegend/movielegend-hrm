import { FacePoseType, Gender } from '@prisma/client';
export declare class FaceImageDto {
    fileId?: string;
    pose: FacePoseType;
    imageUrl: string;
}
export declare class RegisterDto {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    idCardNumber: string;
    dateOfBirth?: string;
    idCardFrontFileId?: string;
    idCardBackFileId?: string;
    gender?: Gender;
    requestedDepartmentId: string;
    avatarUrl?: string;
    faceImages: FaceImageDto[];
}
