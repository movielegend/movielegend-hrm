import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignShift,
  assignShiftBatch,
  createShift,
  createShiftRegistration,
  createShiftSwap,
  deleteShift,
  getMySchedule,
  getShifts,
  updateShift,
} from '../api/shifts.api';
import { queryKeys } from '../constants/queryKeys';
import type {
  AssignShiftPayload,
  CreateShiftPayload,
  ShiftRegistrationPayload,
  ShiftSwapPayload,
  UpdateShiftPayload,
} from '../types/shift.types';

export function useShifts() {
  return useQuery({
    queryKey: queryKeys.shifts(),
    queryFn: getShifts,
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
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAssignShiftBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userIds: string[]; departmentId: string; shiftId: string; dates: string[] }) => assignShiftBatch(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shift-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
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
