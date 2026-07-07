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
            userId: string | null;
            type: string;
            description: string | null;
            title: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.DocumentStatus;
            rejectionReason: string | null;
            storageKey: string | null;
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
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
