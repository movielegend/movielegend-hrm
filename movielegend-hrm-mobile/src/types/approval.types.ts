import type { Department } from './department.types';
import type { EmployeeUser, ApprovalStatus } from './employee.types';

export interface ApprovalRequest {
  id: string;
  userId: string;
  requestedDepartmentId: string;
  status: ApprovalStatus;
  rejectionReason?: string | null;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requestedDepartment?: Department;
  user?: EmployeeUser;
  histories?: Array<{
    id: string;
    action: string;
    note?: string | null;
    createdAt?: string;
  }>;
}

export interface ApprovalFilters {
  departmentId?: string;
  status?: ApprovalStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RejectApprovalPayload {
  reason: string;
}
