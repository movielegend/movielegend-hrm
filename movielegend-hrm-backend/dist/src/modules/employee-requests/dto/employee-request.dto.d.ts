import { EmployeeRequestStatus, EmployeeRequestType } from '@prisma/client';
export declare class CreateEmployeeRequestDto {
    type: EmployeeRequestType;
    title: string;
    content: string;
    amount?: number;
    attachmentMetadata?: Record<string, unknown>;
    referenceId?: string;
}
export declare class EmployeeRequestQueryDto {
    type?: EmployeeRequestType;
    status?: EmployeeRequestStatus;
    fromDate?: string;
    toDate?: string;
    page: number;
    limit: number;
}
