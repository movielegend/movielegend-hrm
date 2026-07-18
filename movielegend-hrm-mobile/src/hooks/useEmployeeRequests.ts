import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEmployeeRequest, getEmployeeRequests, getMyEmployeeRequests, getEmployeeRequestById, approveEmployeeRequest, rejectEmployeeRequest } from '../api/employee-requests.api';
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
    mutationFn: (id: string) => approveEmployeeRequest(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data.id] });
    },
  });
}

export function useRejectEmployeeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectEmployeeRequest(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-request', data.id] });
    },
  });
}
