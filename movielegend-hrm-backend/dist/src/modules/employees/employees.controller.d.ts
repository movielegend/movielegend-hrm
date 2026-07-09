import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ScopedEmployeeQueryDto } from './dto/scoped-employee-query.dto';
import { EmployeesService } from './employees.service';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
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
            type: string;
            title: string | null;
            status: import("@prisma/client").$Enums.DocumentStatus;
            rejectionReason: string | null;
            fileName: string;
            storageKey: string | null;
            fileUrl: string;
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
    }>;
}
