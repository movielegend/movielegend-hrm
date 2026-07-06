import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveLeaveRequest,
  createLeaveRequest,
  getLeaveRequests,
  getLeaveTypes,
  rejectLeaveRequest,
} from '../api/leave.api';
import { queryKeys } from '../constants/queryKeys';
import type { CreateLeaveRequestPayload, LeaveRequestFilters, RejectRequestPayload } from '../types/leave.types';

export function useLeaveRequests(filters: LeaveRequestFilters = {}) {
  return useQuery({
    queryKey: queryKeys.leaveRequests(filters),
    queryFn: () => getLeaveRequests(filters),
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave', 'types'],
    queryFn: getLeaveTypes,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeaveRequestPayload) => createLeaveRequest(payload),
    onSuccess: () => invalidateLeave(queryClient),
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveLeaveRequest(id),
    onSuccess: () => invalidateLeave(queryClient),
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectRequestPayload }) => rejectLeaveRequest(id, payload),
    onSuccess: () => invalidateLeave(queryClient),
  });
}

function invalidateLeave(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['leave'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
