import type { ShiftAssignment } from './shift.types';
import type { EmployeeUser } from './employee.types';

export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'MISSING' | 'ADJUSTED';
export type AttendanceUiState = 'NONE' | 'CHECKED_IN' | 'CHECKED_OUT';
export type AttendanceAdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  departmentId: string;
  shiftAssignmentId: string;
  workDate: string;
  checkInAt: string;
  checkOutAt?: string | null;
  checkInLatitude?: string | number | null;
  checkInLongitude?: string | number | null;
  checkOutLatitude?: string | number | null;
  checkOutLongitude?: string | number | null;
  status: AttendanceStatus;
  createdAt?: string;
  updatedAt?: string;
  user?: EmployeeUser;
  shiftAssignment?: ShiftAssignment;
  photo?: {
    fileId: string;
    fileUrl: string;
  } | null;
}

export interface CheckInPayload {
  workDate: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  wifiSsid?: string;
  wifiBssid?: string;
  photoFileId?: string;
  /** Deprecated backend transition field. Prefer photoFileId. */
  faceImage?: string;
}

export interface CheckOutPayload {
  latitude: number;
  longitude: number;
  photoFileId?: string;
  faceImage?: string;
  accuracy?: number;
}

export interface AttendanceAdjustmentPayload {
  attendanceRecordId?: string;
  requestedCheckInAt?: string;
  requestedCheckOutAt?: string;
  reason: string;
}

export interface AttendanceAdjustment {
  id: string;
  userId: string;
  departmentId: string;
  attendanceRecordId?: string | null;
  requestedCheckInAt?: string | null;
  requestedCheckOutAt?: string | null;
  reason: string;
  status: AttendanceAdjustmentStatus;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceLocationPayload {
  branchId?: string;
  departmentIds?: string[];
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export interface AttendanceLocation extends Omit<AttendanceLocationPayload, 'branchId' | 'departmentIds'> {
  id: string;
  branchId?: string | null;
  isActive?: boolean;
}

export interface AttendanceHistoryFilters {
  departmentId?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export interface CurrentAttendanceResponse {
  state: AttendanceUiState;
  attendance: AttendanceRecord | null;
}

export interface AttendanceDetail extends AttendanceRecord {
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  workedMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeMinutes?: number;
  gps?: {
    checkInLatitude?: string | number | null;
    checkInLongitude?: string | number | null;
    checkOutLatitude?: string | number | null;
    checkOutLongitude?: string | number | null;
    attendanceLocation?: AttendanceLocation | null;
  };
  adjustmentSummary?: AttendanceAdjustment[];
}
