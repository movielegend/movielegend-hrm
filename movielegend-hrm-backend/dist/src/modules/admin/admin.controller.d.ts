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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        roleId: string;
        scopeType: import("@prisma/client").$Enums.RoleScopeType;
        scopeId: string | null;
    }>;
    revokeRole(id: string, actor: AuthenticatedUser): Promise<{
        revoked: boolean;
    }>;
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
                userId: string;
                fullName: string;
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
                positionId: string | null;
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
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    code: string;
                    name: string;
                    description: string | null;
                    leaderUserId: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
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
                userId: string;
                positionId: string | null;
                departmentId: string;
                leftAt: Date | null;
                isPrimary: boolean;
                joinedAt: Date;
            })[];
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
            userId: string;
            fullName: string;
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
            positionId: string | null;
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
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                name: string;
                description: string | null;
                leaderUserId: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
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
            userId: string;
            positionId: string | null;
            departmentId: string;
            leftAt: Date | null;
            isPrimary: boolean;
            joinedAt: Date;
        })[];
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
    createUser(dto: CreateUserDto, actor: AuthenticatedUser): Promise<{
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
    updateUser(id: string, dto: UpdateUserDto): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            fullName: string;
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
            positionId: string | null;
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
    deleteUser(id: string, actor: AuthenticatedUser): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
