export type OtReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OtReportPhoto {
  id: string;
  otReportId: string;
  fileId: string;
  file?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
}

export interface OtReport {
  id: string;
  userId: string;
  departmentId: string;
  otDate: string;
  startTime: string;
  endTime: string;
  proposedPercent: number;
  approvedPercent?: number | null;
  reason?: string | null;
  status: OtReportStatus;
  validOtMinutes: number;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  photos?: OtReportPhoto[];
  user?: {
    id: string;
    userCode?: string;
    profile?: {
      fullName?: string;
      avatarUrl?: string;
    };
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  decidedBy?: {
    id: string;
    userCode?: string;
    profile?: {
      fullName?: string;
    };
  } | null;
}

export interface CreateOtReportPayload {
  otDate: string;
  startTime: string;
  endTime: string;
  proposedPercent?: number;
  reason?: string;
  photoFileIds: string[];
}

export interface UpdateOtReportPayload {
  startTime?: string;
  endTime?: string;
  proposedPercent?: number;
  reason?: string;
  photoFileIds?: string[];
}

export interface ApproveOtReportPayload {
  approvedPercent?: number;
}

export interface RejectOtReportPayload {
  rejectionReason: string;
}

export interface OtReportFilters {
  status?: OtReportStatus | 'ALL';
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
