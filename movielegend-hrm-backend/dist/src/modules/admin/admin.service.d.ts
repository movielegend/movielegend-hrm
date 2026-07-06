import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { LeaderAssignmentDto } from './dto/leader-assignment.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assignLeader(dto: LeaderAssignmentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        roleId: string;
        scopeType: import("@prisma/client").$Enums.RoleScopeType;
        scopeId: string | null;
    }>;
    revokeLeader(id: string, actor: AuthenticatedUser): Promise<{
        revoked: boolean;
    }>;
    findUsers(query: UserQueryDto): Promise<{
        items: {
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                fullName: string;
                dateOfBirth: Date | null;
                gender: import("@prisma/client").$Enums.Gender | null;
                idCardNumber: string;
                idCardIssueDate: Date | null;
                idCardIssuePlace: string | null;
                permanentAddress: string | null;
                temporaryAddress: string | null;
                avatarUrl: string | null;
                joinDate: Date | null;
                officialDate: Date | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                emergencyContactName: string | null;
                emergencyContactPhone: string | null;
                positionId: string | null;
                userId: string;
            } | null;
            roles: ({
                role: {
                    id: string;
                    code: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isSystem: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                roleId: string;
                scopeType: import("@prisma/client").$Enums.RoleScopeType;
                scopeId: string | null;
            })[];
            departmentLinks: ({
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
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                departmentId: string;
                positionId: string | null;
                userId: string;
                isPrimary: boolean;
                joinedAt: Date;
                leftAt: Date | null;
            })[];
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            email: string | null;
            phone: string;
            userCode: string;
            accountStatus: import("@prisma/client").$Enums.AccountStatus;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            lastLoginAt: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findUser(id: string): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            dateOfBirth: Date | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            idCardNumber: string;
            idCardIssueDate: Date | null;
            idCardIssuePlace: string | null;
            permanentAddress: string | null;
            temporaryAddress: string | null;
            avatarUrl: string | null;
            joinDate: Date | null;
            officialDate: Date | null;
            employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            positionId: string | null;
            userId: string;
        } | null;
        roles: ({
            role: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                isSystem: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            roleId: string;
            scopeType: import("@prisma/client").$Enums.RoleScopeType;
            scopeId: string | null;
        })[];
        departmentLinks: ({
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            positionId: string | null;
            userId: string;
            isPrimary: boolean;
            joinedAt: Date;
            leftAt: Date | null;
        })[];
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        email: string | null;
        phone: string;
        userCode: string;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        lastLoginAt: Date | null;
    }>;
    updateUser(id: string, dto: UpdateUserDto): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            dateOfBirth: Date | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            idCardNumber: string;
            idCardIssueDate: Date | null;
            idCardIssuePlace: string | null;
            permanentAddress: string | null;
            temporaryAddress: string | null;
            avatarUrl: string | null;
            joinDate: Date | null;
            officialDate: Date | null;
            employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            positionId: string | null;
            userId: string;
        } | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        email: string | null;
        phone: string;
        userCode: string;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        lastLoginAt: Date | null;
    }>;
}
