import { AccountStatus, EmploymentStatus } from '@prisma/client';
export declare class PaginationDto {
    page?: number;
    limit?: number;
}
export declare class EmployeeReportQueryDto extends PaginationDto {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    positionId?: string;
    employmentStatus?: EmploymentStatus;
    accountStatus?: AccountStatus;
    joinDateFrom?: string;
    joinDateTo?: string;
    search?: string;
}
export declare class DateRangeReportQueryDto extends PaginationDto {
    fromDate?: string;
    toDate?: string;
    departmentId?: string;
    userId?: string;
    branchId?: string;
    status?: string;
}
export declare class KpiReportQueryDto extends DateRangeReportQueryDto {
    templateId?: string;
}
