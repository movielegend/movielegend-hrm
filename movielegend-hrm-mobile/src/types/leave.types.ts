import type { EmployeeUser } from './employee.types';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  annualQuotaDays?: string | number | null;
  isPaid?: boolean;
  isActive?: boolean;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  balanceDays: string | number;
  usedDays: string | number;
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  departmentId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: string | number;
  reason: string;
  status: LeaveRequestStatus;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: EmployeeUser;
  leaveType?: LeaveType;
}

export interface CreateLeaveRequestPayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveRequestFilters {
  departmentId?: string;
  status?: LeaveRequestStatus;
}

export interface RejectRequestPayload {
  reason: string;
}
