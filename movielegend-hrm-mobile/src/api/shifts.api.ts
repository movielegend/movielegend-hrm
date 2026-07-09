import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  AssignShiftPayload,
  CreateShiftPayload,
  Shift,
  ShiftAssignment,
  ShiftRegistrationPayload,
  ShiftSwap,
  ShiftSwapPayload,
  UpdateShiftPayload,
} from '../types/shift.types';

export async function getShifts(): Promise<Shift[]> {
  const response = await apiClient.get<ApiResponse<Shift[]>>('/shifts');
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
