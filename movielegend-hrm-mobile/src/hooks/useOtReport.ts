import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOtReport,
  getMyOtReports,
  getPendingOtReports,
  getOtReportDetail,
  updateOtReport,
  approveOtReport,
  rejectOtReport,
} from '../api/ot-report.api';
import type {
  CreateOtReportPayload,
  UpdateOtReportPayload,
  ApproveOtReportPayload,
  RejectOtReportPayload,
  OtReportFilters,
} from '../types/ot-report.types';

export function useMyOtReports(filters: OtReportFilters = {}) {
  return useQuery({
    queryKey: ['ot-reports', 'my', filters],
    queryFn: () => getMyOtReports(filters),
  });
}

export function usePendingOtReports(filters: OtReportFilters = {}) {
  return useQuery({
    queryKey: ['ot-reports', 'pending', filters],
    queryFn: () => getPendingOtReports(filters),
  });
}

export function useOtReportDetail(id: string) {
  return useQuery({
    queryKey: ['ot-reports', 'detail', id],
    queryFn: () => getOtReportDetail(id),
    enabled: Boolean(id),
  });
}

export function useCreateOtReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOtReportPayload) => createOtReport(payload),
    onSuccess: () => invalidateOtReports(queryClient),
  });
}

export function useUpdateOtReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOtReportPayload }) => updateOtReport(id, payload),
    onSuccess: () => invalidateOtReports(queryClient),
  });
}

export function useApproveOtReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ApproveOtReportPayload }) => approveOtReport(id, payload),
    onSuccess: () => invalidateOtReports(queryClient),
  });
}

export function useRejectOtReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOtReportPayload }) => rejectOtReport(id, payload),
    onSuccess: () => invalidateOtReports(queryClient),
  });
}

function invalidateOtReports(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['ot-reports'] });
  void queryClient.invalidateQueries({ queryKey: ['attendance'] });
}
