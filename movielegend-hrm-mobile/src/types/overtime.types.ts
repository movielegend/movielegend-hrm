export type OvertimeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface OvertimeRequest {
  id: string;
  userId: string;
  departmentId: string;
  workDate: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: OvertimeRequestStatus;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOvertimeRequestPayload {
  workDate: string;
  startAt: string;
  endAt: string;
  reason: string;
}

export interface OvertimeRequestFilters {
  status?: OvertimeRequestStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
