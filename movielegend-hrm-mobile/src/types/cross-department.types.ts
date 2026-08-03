export type CrossDepartmentRequestStatus =
  | 'PENDING_SOURCE_APPROVAL'
  | 'SOURCE_APPROVED'
  | 'SOURCE_REJECTED'
  | 'TARGET_ASSIGNED'
  | 'TARGET_ACCEPTED'
  | 'TARGET_REJECTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'REVISION_REQUESTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface CrossDepartmentRequestDto {
  id: string;
  requestCode?: string;
  taskId?: string | null;
  createdByUserId: string;
  assignedToUserId?: string | null;
  sourceDepartmentId: string;
  sourceDepartment?: { id: string; code: string; name: string } | null;
  targetDepartmentId: string;
  targetDepartment?: { id: string; code: string; name: string } | null;
  title: string;
  content: string;
  status: CrossDepartmentRequestStatus;
  priority?: string;
  dueAt?: string | null;
  progress?: number;
  resultSummary?: string | null;
  rating?: number | null;
  decidedByUserId?: string | null;
  decidedBy?: { id: string; userCode: string; profile?: { fullName?: string | null } | null } | null;
  assignedTo?: { id: string; userCode: string; profile?: { fullName?: string | null, avatarUrl?: string | null } | null } | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: { id: string; userCode: string; profile?: { fullName?: string | null, avatarUrl?: string | null } | null } | null;
}

export interface CreateCrossDepartmentRequestPayload {
  sourceDepartmentId: string;
  targetDepartmentId: string;
  taskId?: string;
  title: string;
  content: string;
  priority?: string;
  dueAt?: string;
}

export interface RejectCrossDepartmentRequestPayload {
  reason: string;
}

export interface AssignTargetPayload {
  assignedToUserId: string;
}

export interface UpdateProgressPayload {
  progress: number;
}

export interface SubmitDeliverablePayload {
  resultSummary?: string;
}

export interface CompleteTaskPayload {
  rating?: number;
}
