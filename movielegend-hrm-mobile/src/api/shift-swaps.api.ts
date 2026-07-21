import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { ShiftSwap } from '../types/shift.types';

export interface CreateShiftSwapPayload {
  fromShiftAssignmentId: string;
  targetUserId: string;
  toShiftAssignmentId: string;
  reason?: string;
}

export interface UpdateShiftSwapStatusPayload {
  status: 'PENDING_TARGET_APPROVAL' | 'PENDING_LEADER_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
}

export async function createShiftSwapRequest(payload: CreateShiftSwapPayload): Promise<ShiftSwap> {
  const response = await apiClient.post<ApiResponse<ShiftSwap>>('/shift-swaps', payload);
  return unwrapData(response);
}

export async function getTargetShift(userId: string, date: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>(`/shift-swaps/target-shift/${userId}/${date}`);
  return unwrapData(response);
}

export async function getAvailableTargets(): Promise<{ items: any[] }> {
  const response = await apiClient.get<ApiResponse<{ items: any[] }>>('/shift-swaps/available-targets');
  return unwrapData(response);
}

export async function getMyShiftSwaps(): Promise<ShiftSwap[]> {
  const response = await apiClient.get<ApiResponse<ShiftSwap[]>>('/shift-swaps/me');
  return unwrapData(response);
}

export async function getLeaderPendingSwaps(): Promise<ShiftSwap[]> {
  const response = await apiClient.get<ApiResponse<ShiftSwap[]>>('/shift-swaps/leader-pending');
  return unwrapData(response);
}

export async function updateShiftSwapStatus(id: string, payload: UpdateShiftSwapStatusPayload): Promise<ShiftSwap> {
  const response = await apiClient.patch<ApiResponse<ShiftSwap>>(`/shift-swaps/${id}/status`, payload);
  return unwrapData(response);
}

export async function getShiftSwapById(id: string): Promise<ShiftSwap> {
  const response = await apiClient.get<ApiResponse<ShiftSwap>>(`/shift-swaps/${id}`);
  return unwrapData(response);
}
