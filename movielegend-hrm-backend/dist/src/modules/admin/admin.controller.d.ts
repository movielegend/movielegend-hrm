import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminService } from './admin.service';
import { AssignRoleDto } from './dto/role-assignment.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LeaderAssignmentDto } from './dto/leader-assignment.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    assignRole(dto: AssignRoleDto, actor: AuthenticatedUser): Promise<{
        userId: string;
        roleId: string;
        scopeType: import("@prisma/client").$Enums.RoleScopeType;
        scopeId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    revokeRole(id: string, actor: AuthenticatedUser): Promise<{
        revoked: boolean;
    }>;
    assignLeader(dto: LeaderAssignmentDto, actor: AuthenticatedUser): Promise<{
        userId: string;
        roleId: string;
        scopeType: import("@prisma/client").$Enums.RoleScopeType;
        scopeId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    revokeLeader(id: string, actor: AuthenticatedUser): Promise<{
        revoked: boolean;
    }>;
    findUsers(query: UserQueryDto): Promise<{
        items: {
            roles: ({
                role: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    code: string;
                    isSystem: boolean;
                };
            } & {
                userId: string;
                roleId: string;
                scopeType: import("@prisma/client").$Enums.RoleScopeType;
                scopeId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            })[];
            profile: {
                userId: string;
                fullName: string;
                positionId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
            departmentLinks: ({
                department: {
                    description: string | null;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    code: string;
                    leaderUserId: string | null;
                };
                position: {
                    description: string | null;
                    departmentId: string | null;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    code: string;
                } | null;
            } & {
                userId: string;
                departmentId: string;
                positionId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                leftAt: Date | null;
                isPrimary: boolean;
                joinedAt: Date;
            })[];
            phone: string;
            email: string | null;
            accountStatus: import("@prisma/client").$Enums.AccountStatus;
            isActive: boolean;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userCode: string;
            lastLoginAt: Date | null;
            deletedAt: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findUser(id: string): Promise<{
        roles: ({
            role: {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
                isSystem: boolean;
            };
        } & {
            userId: string;
            roleId: string;
            scopeType: import("@prisma/client").$Enums.RoleScopeType;
            scopeId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        profile: {
            userId: string;
            fullName: string;
            positionId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
        departmentLinks: ({
            department: {
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                leaderUserId: string | null;
            };
            position: {
                description: string | null;
                departmentId: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                code: string;
            } | null;
        } & {
            userId: string;
            departmentId: string;
            positionId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            leftAt: Date | null;
            isPrimary: boolean;
            joinedAt: Date;
        })[];
        phone: string;
        email: string | null;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        isActive: boolean;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userCode: string;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    createUser(dto: CreateUserDto, actor: AuthenticatedUser): Promise<{
        phone: string;
        email: string | null;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        isActive: boolean;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userCode: string;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    updateUser(id: string, dto: UpdateUserDto): Promise<{
        profile: {
            userId: string;
            fullName: string;
            positionId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
        phone: string;
        email: string | null;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        isActive: boolean;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userCode: string;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
}
