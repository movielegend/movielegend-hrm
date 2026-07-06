import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { ApprovalPolicyService } from './approval-policy.service';
import { ApprovalQueryDto } from './dto/approval-query.dto';
import { RejectDto } from './dto/reject.dto';
export declare class ApprovalsService {
    private readonly prisma;
    private readonly policy;
    constructor(prisma: PrismaService, policy: ApprovalPolicyService);
    findAll(actor: AuthenticatedUser, query: ApprovalQueryDto): Promise<{
        items: ({
            user: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                phone: string;
                userCode: string;
                accountStatus: import("@prisma/client").$Enums.AccountStatus;
                approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
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
            };
            requestedDepartment: {
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
            histories: {
                id: string;
                createdAt: Date;
                action: import("@prisma/client").$Enums.ApprovalAction;
                actorUserId: string | null;
                approvalRequestId: string;
                note: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            requestedDepartmentId: string;
            rejectionReason: string | null;
            decidedByUserId: string | null;
            decidedAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    approve(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        status: "APPROVED";
    }>;
    reject(id: string, dto: RejectDto, actor: AuthenticatedUser): Promise<{
        id: string;
        status: "REJECTED";
    }>;
    private findPendingRequest;
    private buildDepartmentFilter;
}
