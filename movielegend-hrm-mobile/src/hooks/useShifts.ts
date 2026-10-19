import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignShift,
  assignShiftBatch,
  createShift,
  createShiftRegistration,
  createShiftSwap,
  deleteShift,
  getDepartmentShiftAssignments,
  getMySchedule,
  getShifts,
  updateShift,
  revokeShiftAssignment,
  batchDeleteShiftCells,
} from '../api/shifts.api';
import { queryKeys } from '../constants/queryKeys';
import type {
  AssignShiftBatchPayload,
  AssignShiftPayload,
  BatchDeleteShiftCellsPayload,
  CreateShiftPayload,
  DepartmentAssignmentsQuery,
  ShiftRegistrationPayload,
  ShiftSwapPayload,
  UpdateShiftPayload,
} from '../types/shift.types';

export function useShifts(departmentId?: string) {
  return useQuery({
    queryKey: departmentId ? ['shifts', departmentId] : queryKeys.shifts(),
    queryFn: () => getShifts(departmentId),
  });
}

export function useMySchedule() {
  return useQuery({
    queryKey: queryKeys.shiftSchedule(),
    queryFn: getMySchedule,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateShiftPayload) => createShift(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useUpdateShift(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateShiftPayload) => updateShift(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useAssignShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignShiftPayload) => assignShift(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shift-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['shift-assignments-dept'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAssignShiftBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignShiftBatchPayload) => assignShiftBatch(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shift-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['shift-assignments-dept'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDepartmentShiftAssignments(params?: DepartmentAssignmentsQuery, enabled = true) {
  return useQuery({
    queryKey: ['shift-assignments-dept', params?.departmentId, params?.startDate, params?.endDate],
    queryFn: () => (params ? getDepartmentShiftAssignments(params) : Promise.resolve([])),
    enabled: Boolean(enabled && params?.departmentId && params?.startDate && params?.endDate),
  });
}


export function useCreateShiftRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShiftRegistrationPayload) => createShiftRegistration(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shift-schedule'] }),
  });
}

export function useCreateShiftSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShiftSwapPayload) => createShiftSwap(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['shift-schedule'] }),
  });
}

export function useRevokeShiftAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeShiftAssignment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
      void queryClient.invalidateQueries({ queryKey: ['shift-schedule'] });
    },
  });
}

export function useBatchDeleteShiftCells() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchDeleteShiftCellsPayload) => batchDeleteShiftCells(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
      void queryClient.invalidateQueries({ queryKey: ['shift-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['shift-assignments-dept'] });
    },
  });
}

