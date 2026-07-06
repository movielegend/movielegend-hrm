import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto, RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, ipAddress: string, userAgent?: string): Promise<{
        id: string;
        userCode: string;
        approvalRequestId: string;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
    }>;
    login(dto: LoginDto, ipAddress: string, userAgent?: string): Promise<{
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
    me(user: AuthenticatedUser): Promise<{
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
}
