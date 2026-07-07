import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ApprovalQueryDto } from './dto/approval-query.dto';
import { RejectDto } from './dto/reject.dto';
import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    findAll(user: AuthenticatedUser, query: ApprovalQueryDto): Promise<{
        items: ({
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
            };
            requestedDepartment: {
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
            histories: {
                id: string;
                createdAt: Date;
                action: import("@prisma/client").$Enums.ApprovalAction;
                actorUserId: string | null;
                approvalRequestId: string;
                note: string | null;
            }[];
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
    approve(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        status: "APPROVED";
    }>;
    reject(id: string, dto: RejectDto, user: AuthenticatedUser): Promise<{
        id: string;
        status: "REJECTED";
    }>;
}
