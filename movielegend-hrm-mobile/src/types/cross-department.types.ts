export type CrossDepartmentRequestStatus =
  | 'PENDING_SOURCE_APPROVAL'
  | 'SOURCE_APPROVED'
  | 'SOURCE_REJECTED'
  | 'TARGET_ACCEPTED'
  | 'TARGET_REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface CrossDepartmentRequestDto {
  id: string;
  requestCode?: string;
  taskId?: string | null;
  createdByUserId: string;
  sourceDepartmentId: string;
  sourceDepartment?: { id: string; code: string; name: string } | null;
  targetDepartmentId: string;
  targetDepartment?: { id: string; code: string; name: string } | null;
  title: string;
  content: string;
  status: CrossDepartmentRequestStatus;
  decidedByUserId?: string | null;
  decidedBy?: { id: string; userCode: string; profile?: { fullName?: string | null } | null } | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: { id: string; userCode: string; profile?: { fullName?: string | null } | null } | null;
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
