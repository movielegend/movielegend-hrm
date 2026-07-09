import { LeaveRequestStatus, OvertimeRequestStatus } from '@prisma/client';
export declare class CreateLeaveTypeDto {
    code: string;
    name: string;
}
export declare class CreateLeaveRequestDto {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
}
export declare class CreateOvertimeRequestDto {
    workDate: string;
    startAt: string;
    endAt: string;
    reason: string;
}
export declare class RejectRequestDto {
    reason: string;
}
export declare class LeaveRequestQueryDto {
    departmentId?: string;
    status?: LeaveRequestStatus;
}
export declare class OvertimeRequestQueryDto {
    status?: OvertimeRequestStatus;
    fromDate?: string;
    toDate?: string;
    page: number;
    limit: number;
}
