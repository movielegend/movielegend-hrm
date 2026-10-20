import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  AssignShiftBatchPayload,
  AssignShiftPayload,
  BatchDeleteShiftCellsPayload,
  CreateShiftPayload,
  DepartmentAssignmentsQuery,
  Shift,
  ShiftAssignment,
  ShiftRegistrationPayload,
  ShiftSwap,
  ShiftSwapPayload,
  UpdateShiftPayload,
} from '../types/shift.types';

export async function getShifts(departmentId?: string): Promise<Shift[]> {
  const response = await apiClient.get<ApiResponse<Shift[]>>('/shifts', {
    params: departmentId ? { departmentId } : undefined,
  });
  return unwrapData(response);
}

export async function createShift(payload: CreateShiftPayload): Promise<Shift> {
  const response = await apiClient.post<ApiResponse<Shift>>('/shifts', payload);
  return unwrapData(response);
}

export async function updateShift(id: string, payload: UpdateShiftPayload): Promise<Shift> {
  const response = await apiClient.patch<ApiResponse<Shift>>(`/shifts/${id}`, payload);
  return unwrapData(response);
}

export async function deleteShift(id: string): Promise<unknown> {
  const response = await apiClient.delete<ApiResponse<unknown>>(`/shifts/${id}`);
  return unwrapData(response);
}

export async function assignShift(payload: AssignShiftPayload): Promise<ShiftAssignment> {
  const response = await apiClient.post<ApiResponse<ShiftAssignment>>('/shift-assignments', payload);
  return unwrapData(response);
}

export async function assignShiftBatch(payload: AssignShiftBatchPayload): Promise<unknown> {
  const response = await apiClient.post<ApiResponse<unknown>>('/shift-assignments/batch', payload);
  return unwrapData(response);
}

export async function getDepartmentShiftAssignments(params: DepartmentAssignmentsQuery): Promise<ShiftAssignment[]> {
  const response = await apiClient.get<ApiResponse<ShiftAssignment[]>>('/shift-assignments/department', {
    params,
  });
  return unwrapData(response);
}

export async function revokeShiftAssignment(id: string): Promise<unknown> {
  const response = await apiClient.delete<ApiResponse<unknown>>(`/shift-assignments/${id}`);
  return unwrapData(response);
}

export async function batchDeleteShiftCells(payload: BatchDeleteShiftCellsPayload): Promise<{ count: number }> {
  try {
    const response = await apiClient.post<ApiResponse<{ count: number }>>('/shift-assignments/cells/batch-delete', payload);
    return unwrapData(response);
  } catch (err: any) {
    const ids = payload.items.map((i) => i.id).filter(Boolean) as string[];
    if (ids.length > 0) {
      await Promise.all(ids.map((id) => revokeShiftAssignment(id)));
      return { count: ids.length };
    }
    throw err;
  }
}

export async function getMySchedule(): Promise<ShiftAssignment[]> {
  const response = await apiClient.get<ApiResponse<ShiftAssignment[]>>('/shift-assignments/me');
  return unwrapData(response);
}

export async function createShiftRegistration(payload: ShiftRegistrationPayload): Promise<unknown> {
  const response = await apiClient.post<ApiResponse<unknown>>('/shift-assignments/registrations', payload);
  return unwrapData(response);
}

export async function createShiftSwap(payload: ShiftSwapPayload): Promise<ShiftSwap> {
  const response = await apiClient.post<ApiResponse<ShiftSwap>>('/shift-assignments/swaps', payload);
  return unwrapData(response);
}

