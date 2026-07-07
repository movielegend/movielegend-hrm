import { FaceImageDto } from '../../auth/dto/register.dto';
export declare class UpdateMeDto {
    phone?: string;
    email?: string;
    avatarUrl?: string;
}
export declare class UpdateFaceDto {
    faceImages: FaceImageDto[];
}
