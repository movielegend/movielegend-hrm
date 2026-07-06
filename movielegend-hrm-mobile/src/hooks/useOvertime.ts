import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveOvertimeRequest, createOvertimeRequest, getMyOvertimeRequests, getPendingOvertimeRequests, rejectOvertimeRequest } from '../api/overtime.api';
import { queryKeys } from '../constants/queryKeys';
import type { RejectRequestPayload } from '../types/leave.types';
import type { CreateOvertimeRequestPayload, OvertimeRequestFilters } from '../types/overtime.types';

export function useMyOvertimeRequests(filters: OvertimeRequestFilters = {}) {
  return useQuery({
    queryKey: queryKeys.overtimeRequests({ ...filters, scope: 'my' }),
    queryFn: () => getMyOvertimeRequests(filters),
  });
}

export function usePendingOvertimeRequests(filters: OvertimeRequestFilters = {}) {
  return useQuery({
    queryKey: queryKeys.overtimeRequests({ ...filters, scope: 'pending' }),
    queryFn: () => getPendingOvertimeRequests(filters),
  });
}

export function useCreateOvertimeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOvertimeRequestPayload) => createOvertimeRequest(payload),
    onSuccess: () => invalidateOvertime(queryClient),
  });
}

export function useApproveOvertimeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveOvertimeRequest(id),
    onSuccess: () => invalidateOvertime(queryClient),
  });
}

export function useRejectOvertimeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectRequestPayload }) => rejectOvertimeRequest(id, payload),
    onSuccess: () => invalidateOvertime(queryClient),
  });
}

function invalidateOvertime(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['overtime'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
