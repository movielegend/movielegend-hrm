import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto, RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
interface RequestMeta {
    ipAddress?: string;
    userAgent?: string;
}
interface TokenPayload extends AuthenticatedUser {
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    private readonly uploads;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService, uploads: UploadsService);
    register(dto: RegisterDto, meta: RequestMeta): Promise<{
        id: string;
        userCode: string;
        approvalRequestId: string;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
    }>;
    login(dto: LoginDto, meta: RequestMeta): Promise<{
        user: {
            id: string;
            userCode: string;
            fullName: string;
            phone: string;
            email: string | null;
            avatarUrl: string | null | undefined;
            roles: string[];
            permissions: string[];
            department: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                leaderUserId: string | null;
            };
            position: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                departmentId: string | null;
            } | null;
            hasFaceData: boolean;
            accountStatus: import("@prisma/client").$Enums.AccountStatus;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            isActive: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(dto: LogoutDto): Promise<{
        revoked: boolean;
    }>;
    me(userId: string): Promise<{
        id: string;
        userCode: string;
        fullName: string;
        phone: string;
        email: string | null;
        avatarUrl: string | null | undefined;
        roles: string[];
        permissions: string[];
        department: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            companyId: string;
            branchId: string | null;
            parentId: string | null;
            leaderUserId: string | null;
        };
        position: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentId: string | null;
        } | null;
        hasFaceData: boolean;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        isActive: boolean;
    }>;
    buildPayload(userId: string): Promise<TokenPayload>;
    private createTokens;
    private assertRequiredFaceImages;
    private verifyRefreshToken;
    private parseRefreshDays;
    private userInclude;
    private toAuthUser;
}
export {};
