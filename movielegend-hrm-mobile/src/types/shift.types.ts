import type { Department } from './department.types';
import type { EmployeeUser } from './employee.types';

export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  checkInEarlyMinutes: number;
  checkInLateMinutes: number;
  checkOutEarlyMinutes?: number;
  checkOutLateMinutes?: number;
  isNightShift: boolean;
  isActive: boolean;
  departmentId?: string | null;
  department?: Department | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  departmentId: string;
  shiftId: string;
  workDate: string;
  status: 'ASSIGNED' | 'CANCELLED';
  assignedByUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  shift?: Shift;
  department?: Department;
  user?: EmployeeUser;
  attendanceRecords?: {
    id: string;
    checkInAt: string;
    checkOutAt?: string | null;
    status?: string;
  }[];
}

export interface CreateShiftPayload {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  checkInEarlyMinutes?: number;
  checkInLateMinutes?: number;
  isNightShift?: boolean;
  departmentId?: string | null;
}

export type UpdateShiftPayload = Partial<CreateShiftPayload> & {
  isActive?: boolean;
};

export interface AssignShiftPayload {
  userId: string;
  departmentId: string;
  shiftId: string;
  workDate: string;
  allowOverwrite?: boolean;
  reason?: string;
}

export interface AssignShiftBatchPayload {
  userIds: string[];
  departmentId: string;
  shiftId: string;
  dates: string[];
  allowOverwrite?: boolean;
  reason?: string;
}

export interface DepartmentAssignmentsQuery {
  departmentId: string;
  startDate: string;
  endDate: string;
}


export interface ShiftRegistrationPayload {
  shiftId: string;
  workDate: string;
  reason: string;
}

export interface ShiftSwapPayload {
  targetUserId: string;
  fromShiftId: string;
  toShiftId: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface ShiftSwap {
  id: string;
  requesterUserId: string;
  targetUserId: string;
  departmentId: string;
  fromShiftId: string;
  toShiftId: string;
  fromDate: string;
  toDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING_TARGET_APPROVAL' | 'PENDING_LEADER_APPROVAL';
  reason?: string | null;
  createdAt?: string;
  requester?: EmployeeUser & { fullName?: string };
  target?: EmployeeUser & { fullName?: string };
  fromShift?: Shift;
  toShift?: Shift;
}

export interface BatchDeleteShiftCellItem {
  id?: string;
  userId: string;
  workDate: string;
}

export interface BatchDeleteShiftCellsPayload {
  items: BatchDeleteShiftCellItem[];
}
