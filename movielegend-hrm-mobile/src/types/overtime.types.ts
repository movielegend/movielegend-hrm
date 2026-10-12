export type OvertimeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface OvertimeRequestPhoto {
  id: string;
  overtimeRequestId: string;
  fileId: string;
  createdAt?: string;
  file?: {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    size?: number;
  };
}

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
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    userCode?: string;
    phone?: string;
    email?: string;
    profile?: {
      fullName?: string;
      avatarUrl?: string | null;
    } | null;
  };
  department?: {
    id: string;
    name?: string;
    code?: string;
  };
  photos?: OvertimeRequestPhoto[];
}

export interface CreateOvertimeRequestPayload {
  workDate: string;
  startAt: string;
  endAt: string;
  reason: string;
  photoFileIds?: string[];
}

export interface OvertimeRequestFilters {
  status?: OvertimeRequestStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
