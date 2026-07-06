import type { Department } from './department.types';
import type { EmployeeUser } from './employee.types';

export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  checkInEarlyMinutes: number;
  checkInLateMinutes: number;
  checkOutEarlyMinutes?: number;
  checkOutLateMinutes?: number;
  isNightShift: boolean;
  isActive: boolean;
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
}

export interface CreateShiftPayload {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  checkInEarlyMinutes?: number;
  checkInLateMinutes?: number;
  isNightShift?: boolean;
}

export type UpdateShiftPayload = Partial<CreateShiftPayload> & {
  isActive?: boolean;
};

export interface AssignShiftPayload {
  userId: string;
  departmentId: string;
  shiftId: string;
  workDate: string;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason?: string | null;
  createdAt?: string;
}
