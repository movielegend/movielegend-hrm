import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkIn,
  checkOut,
  createAttendanceAdjustment,
  createAttendanceLocation,
  getActiveAttendanceLocations,
  getAttendanceDetail,
  getAttendanceHistory,
  getAttendanceReport,
  getCurrentAttendance,
  trackLocation,
} from '../api/attendance.api';
import { queryKeys } from '../constants/queryKeys';
import type {
  AttendanceAdjustmentPayload,
  AttendanceHistoryFilters,
  AttendanceLocationPayload,
  CheckInPayload,
  CheckOutPayload,
  Coordinates,
} from '../types/attendance.types';

export function useAttendanceHistory(filters: AttendanceHistoryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.attendanceHistory(filters),
    queryFn: () => getAttendanceHistory(filters),
  });
}

export function useAttendanceReport(filters: AttendanceHistoryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.attendanceHistory({ ...filters, report: true }),
    queryFn: () => getAttendanceReport(filters),
  });
}

export function useCurrentAttendance() {
  return useQuery({
    queryKey: queryKeys.attendanceCurrent(),
    queryFn: getCurrentAttendance,
  });
}

export function useAttendanceDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.attendanceDetail(id),
    queryFn: () => getAttendanceDetail(id),
    enabled: Boolean(id),
  });
}

export function useActiveAttendanceLocations() {
  return useQuery({
    queryKey: ['attendance', 'locations', 'active'],
    queryFn: getActiveAttendanceLocations,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInPayload) => checkIn(payload),
    retry: false,
    onSettled: () => invalidateAttendance(queryClient),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckOutPayload) => checkOut(payload),
    retry: false,
    onSettled: () => invalidateAttendance(queryClient),
  });
}

export function useCreateAttendanceAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceAdjustmentPayload) => createAttendanceAdjustment(payload),
    onSuccess: () => invalidateAttendance(queryClient),
  });
}

export function useCreateAttendanceLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceLocationPayload) => createAttendanceLocation(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useTrackLocation() {
  return useMutation({
    mutationFn: (payload: Coordinates) => trackLocation(payload),
    retry: false,
  });
}

function invalidateAttendance(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['attendance'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
