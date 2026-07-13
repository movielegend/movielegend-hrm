import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { ScopedEmployeeQueryDto } from './dto/scoped-employee-query.dto';
export declare class EmployeesService {
    private readonly prisma;
    private readonly scope;
    constructor(prisma: PrismaService, scope: DepartmentScopeService);
    findOne(id: string): Promise<{
        user: {
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
        bankAccounts: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isPrimary: boolean;
            employeeId: string;
            bankName: string;
            accountNumber: string;
            accountName: string;
        }[];
        documents: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string | null;
            storageKey: string | null;
            status: import("@prisma/client").$Enums.DocumentStatus;
            title: string | null;
            type: string;
            rejectionReason: string | null;
            fileUrl: string;
            fileName: string;
            mimeType: string | null;
            documentTypeId: string | null;
            documentNumber: string | null;
            issueDate: Date | null;
            expiryDate: Date | null;
            issuedBy: string | null;
            fileSize: number | null;
            verifiedAt: Date | null;
            acknowledgementStatus: import("@prisma/client").$Enums.AcknowledgementStatus;
            acknowledgedAt: Date | null;
            acknowledgementNote: string | null;
            acknowledgedByIp: string | null;
            employeeId: string;
            verifiedById: string | null;
        }[];
    } & {
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
    }>;
    scoped(actor: AuthenticatedUser, query: ScopedEmployeeQueryDto): Promise<{
        items: {
            id: string;
            userCode: string;
            fullName: string | null;
            avatarUrl: string | null;
            department: {
                id: string;
                name: string;
            };
            position: {
                id: string;
                name: string;
            } | null;
            employmentStatus: import("@prisma/client").$Enums.EmploymentStatus | null;
            isActive: boolean;
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
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
