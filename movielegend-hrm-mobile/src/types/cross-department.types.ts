export type CrossDepartmentRequestStatus =
  | 'PENDING_SOURCE_APPROVAL'
  | 'SOURCE_APPROVED'
  | 'SOURCE_REJECTED'
  | 'TARGET_ACCEPTED'
  | 'TARGET_REJECTED'
  | 'CANCELLED';

export interface CrossDepartmentRequestDto {
  id: string;
  requestCode?: string;
  taskId?: string | null;
  createdByUserId: string;
  sourceDepartmentId: string;
  targetDepartmentId: string;
  title: string;
  content: string;
  status: CrossDepartmentRequestStatus;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCrossDepartmentRequestPayload {
  sourceDepartmentId: string;
  targetDepartmentId: string;
  taskId?: string;
  title: string;
  content: string;
}

export interface RejectCrossDepartmentRequestPayload {
  reason: string;
}
