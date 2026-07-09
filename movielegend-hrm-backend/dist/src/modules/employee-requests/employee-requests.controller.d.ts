import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateEmployeeRequestDto, EmployeeRequestQueryDto } from './dto/employee-request.dto';
import { EmployeeRequestsService } from './employee-requests.service';
export declare class EmployeeRequestsController {
    private readonly employeeRequestsService;
    constructor(employeeRequestsService: EmployeeRequestsService);
    create(dto: CreateEmployeeRequestDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.EmployeeRequestType;
        title: string;
        departmentId: string;
        status: import("@prisma/client").$Enums.EmployeeRequestStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        attachmentMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        referenceId: string | null;
        currentApproverUserId: string | null;
    }>;
    findAll(actor: AuthenticatedUser, departmentId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            userCode: string;
            phone: string;
            email: string | null;
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.EmployeeRequestType;
        title: string;
        departmentId: string;
        status: import("@prisma/client").$Enums.EmployeeRequestStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        attachmentMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        referenceId: string | null;
        currentApproverUserId: string | null;
    })[]>;
    findMine(actor: AuthenticatedUser, query: EmployeeRequestQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.EmployeeRequestType;
            title: string;
            departmentId: string;
            status: import("@prisma/client").$Enums.EmployeeRequestStatus;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            content: string;
            amount: import("@prisma/client/runtime/library").Decimal | null;
            attachmentMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            referenceId: string | null;
            currentApproverUserId: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    approve(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.EmployeeRequestType;
        title: string;
        departmentId: string;
        status: import("@prisma/client").$Enums.EmployeeRequestStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        content: string;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        attachmentMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        referenceId: string | null;
        currentApproverUserId: string | null;
    }>;
}
