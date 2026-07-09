import { ApprovalStatus } from '@prisma/client';
export declare class ApprovalQueryDto {
    departmentId?: string;
    status?: ApprovalStatus;
    search?: string;
    page: number;
    limit: number;
}
