import { AccountStatus, ApprovalStatus } from '@prisma/client';
export declare class UserQueryDto {
    search?: string;
    departmentId?: string;
    role?: string;
    accountStatus?: AccountStatus;
    approvalStatus?: ApprovalStatus;
    isActive?: boolean;
    page: number;
    limit: number;
}
