import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateFaceDto, UpdateMeDto } from './dto/update-me.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly uploads;
    constructor(prisma: PrismaService, uploads: UploadsService);
    updateMe(dto: UpdateMeDto, actor: AuthenticatedUser): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            fullName: string;
            positionId: string | null;
            dateOfBirth: Date | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            idCardNumber: string;
            idCardIssueDate: Date | null;
            idCardIssuePlace: string | null;
            idCardFrontUrl: string | null;
            idCardBackUrl: string | null;
            permanentAddress: string | null;
            temporaryAddress: string | null;
            avatarUrl: string | null;
            joinDate: Date | null;
            officialDate: Date | null;
            employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
        } | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userCode: string;
        phone: string;
        email: string | null;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        lastLoginAt: Date | null;
    }>;
    updateMyFace(dto: UpdateFaceDto, actor: AuthenticatedUser): Promise<{
        success: boolean;
        message: string;
    }>;
}
