import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEmployeeRequest,
  getEmployeeRequests,
  getMyEmployeeRequests,
  getEmployeeRequestById,
  approveEmployeeRequest,
  rejectEmployeeRequest,
  resubmitPurchaseByHr,
  fulfillPurchaseByHr,
  requestCancelCompensatory,
  approveCancelCompensatory,
  rejectCancelCompensatory,
} from '../api/employee-requests.api';
import { queryKeys } from '../constants/queryKeys';
import type { CreateEmployeeRequestPayload, EmployeeRequestFilters } from '../types/request.types';

export function useEmployeeRequests(filters: EmployeeRequestFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.employeeRequests(filters),
    queryFn: () => getEmployeeRequests(filters),
    enabled,
  });
}

export function useMyEmployeeRequests(filters: EmployeeRequestFilters = {}) {
  return useQuery({
    queryKey: queryKeys.employeeRequests({ ...filters, scope: 'my' }),
    queryFn: () => getMyEmployeeRequests(filters),
  });
}

export function useCreateEmployeeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeRequestPayload) => createEmployeeRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useEmployeeRequestById(id: string) {
  return useQuery({
    queryKey: ['employee-request', id],
    queryFn: () => getEmployeeRequestById(id),
    enabled: !!id,
  });
}

export function useApproveEmployeeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: {
      id: string;
      payload?: {
        note?: string;
        disbursementProofUrl?: string;
        bankRefCode?: string;
        forwardToAdmin?: boolean;
        bankAccount?: string;
        bankName?: string;
        accountHolder?: string;
        adjustedAmount?: number;
      };
    } | string) => {
      if (typeof arg === 'string') {
        return approveEmployeeRequest(arg);
      }
      return approveEmployeeRequest(arg.id, arg.payload);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data.id] });
    },
  });
}

export function useRejectEmployeeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: { id: string; payload?: { reason?: string; permanentReject?: boolean } } | string) => {
      if (typeof arg === 'string') {
        return rejectEmployeeRequest(arg);
      }
      return rejectEmployeeRequest(arg.id, arg.payload);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data.id] });
    },
  });
}

export function useResubmitPurchaseByHr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: {
      id: string;
      payload: {
        amount?: number;
        bankAccount?: string;
        bankName?: string;
        accountHolder?: string;
        note?: string;
        explanation?: string;
        images?: string[];
        quoteUrls?: string[];
      };
    }) => resubmitPurchaseByHr(arg.id, arg.payload),
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data?.id] });
    },
  });
}

export function useFulfillPurchaseByHr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: {
      id: string;
      payload: {
        actualAmount?: number;
        note?: string;
        receiptUrl?: string;
        images?: string[];
        receiptUrls?: string[];
        deliveryProofUrls?: string[];
      };
    }) => fulfillPurchaseByHr(arg.id, arg.payload),
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data?.id] });
    },
  });
}

export function useRequestCancelCompensatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: { id: string; reason: string }) =>
      requestCancelCompensatory(arg.id, { reason: arg.reason }),
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['leader-employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data?.id] });
    },
  });
}

export function useApproveCancelCompensatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: { id: string; note?: string }) =>
      approveCancelCompensatory(arg.id, { note: arg.note }),
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['leader-employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data?.id] });
    },
  });
}

export function useRejectCancelCompensatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: { id: string; note?: string }) =>
      rejectCancelCompensatory(arg.id, { note: arg.note }),
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['leader-employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data?.id] });
    },
  });
}


