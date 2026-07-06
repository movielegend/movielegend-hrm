export type EmployeeRequestType =
  | 'ATTENDANCE_ADJUSTMENT'
  | 'LEAVE'
  | 'OVERTIME'
  | 'SHIFT_REGISTRATION'
  | 'SHIFT_SWAP'
  | 'LATE_ARRIVAL'
  | 'EARLY_LEAVE'
  | 'BUSINESS_TRIP'
  | 'ADVANCE'
  | 'EXPENSE'
  | 'PURCHASE'
  | 'EQUIPMENT'
  | 'OTHER';

export type EmployeeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface EmployeeRequest {
  id: string;
  userId: string;
  departmentId: string;
  type: EmployeeRequestType;
  title: string;
  content: string;
  amount?: string | number | null;
  attachmentMetadata?: Record<string, unknown> | null;
  referenceId?: string | null;
  status: EmployeeRequestStatus;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequestPayload {
  type: EmployeeRequestType;
  title: string;
  content: string;
  amount?: number;
  attachmentMetadata?: Record<string, unknown>;
  referenceId?: string;
}

export interface EmployeeRequestFilters {
  departmentId?: string;
  type?: EmployeeRequestType;
  status?: EmployeeRequestStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
