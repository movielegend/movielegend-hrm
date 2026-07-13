import type { AttendanceRecord, AttendanceUiState } from '../../types/attendance.types';
import type { ShiftAssignment } from '../../types/shift.types';
import { businessDateToday, formatDate } from '../../utils/date-time';

export interface CurrentAttendanceSnapshot {
  record?: AttendanceRecord | null;
  uiState: AttendanceUiState;
  checkInStatus?: boolean;
  checkOutStatus?: boolean;
  currentAttendanceStatus?: string | null;
}

export function deriveAttendanceUiState(record?: Pick<AttendanceRecord, 'checkInAt' | 'checkOutAt' | 'status'> | null): AttendanceUiState {
  if (!record?.checkInAt) return 'NONE';
  if (record.checkOutAt || record.status === 'CHECKED_OUT') return 'CHECKED_OUT';
  return 'CHECKED_IN';
}

export function deriveDashboardAttendanceState(today: unknown): CurrentAttendanceSnapshot {
  if (!today || typeof today !== 'object') return { uiState: 'NONE' };
  const value = today as {
    checkInStatus?: boolean;
    checkOutStatus?: boolean;
    currentAttendanceStatus?: string | null;
  };
  if (value.checkOutStatus || value.currentAttendanceStatus === 'CHECKED_OUT') {
    return { uiState: 'CHECKED_OUT', ...value };
  }
  if (value.checkInStatus || value.currentAttendanceStatus === 'CHECKED_IN') {
    return { uiState: 'CHECKED_IN', ...value };
  }
  return { uiState: 'NONE', ...value };
}

export function findTodayShift(assignments: ShiftAssignment[], today: string = businessDateToday()): ShiftAssignment | null {
  return assignments.find((assignment) => formatDate(assignment.workDate) === today) ?? null;
}

const attendanceErrorMessages: Record<string, string> = {
  ALREADY_CHECKED_IN: 'Da co ban ghi check-in cho ngay nay. Ung dung se tai lai trang thai hien tai.',
  ALREADY_CHECKED_OUT: 'Ca nay da checkout.',
  FACE_PROFILE_NOT_READY: 'Ho so khuon mat chua san sang de cham cong.',
  FACE_VERIFICATION_FAILED: 'Xac minh khuon mat khong thanh cong. Hay chup lai anh ro hon.',
  GPS_ACCURACY_TOO_LOW: 'Do chinh xac GPS thap. Hay ra gan cua so hoac bat lai dinh vi.',
  INVALID_NETWORK: 'Vui long ket noi vao mang Wi-Fi cua cong ty de cham cong.',
  INVALID_WIFI: 'WiFi khong hop le theo cau hinh cham cong.',
  NETWORK_ERROR: 'Khong the ket noi may chu. Hay kiem tra mang va tai lai trang thai.',
  NO_ACTIVE_SHIFT: 'Khong co ca lam dang hoat dong.',
  NOT_CHECKED_IN: 'Chua co ban ghi check-in dang mo.',
  OUTSIDE_ATTENDANCE_RADIUS: 'Ban dang ngoai khu vuc cham cong cho phep.',
  SHIFT_ASSIGNMENT_NOT_FOUND: 'Khong tim thay ca lam trong ngay.',
  SHIFT_NOT_ASSIGNED: 'Ban chua duoc phan ca trong ngay.',
  TIMEOUT: 'Ket noi qua han. Ung dung se kiem tra lai trang thai cham cong.',
  TOO_EARLY_TO_CHECK_IN: 'Dang ngoai khung gio check-in cho phep.',
};

export function mapAttendanceError(code: string, fallback: string): string {
  return attendanceErrorMessages[code] ?? fallback;
}

export function shouldRecoverAttendanceState(code: string): boolean {
  return code === 'TIMEOUT' || code === 'NETWORK_ERROR' || code === 'ALREADY_CHECKED_IN' || code === 'ALREADY_CHECKED_OUT';
}
