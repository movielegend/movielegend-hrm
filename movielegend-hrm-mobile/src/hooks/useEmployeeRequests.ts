import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEmployeeRequest, getEmployeeRequests, getMyEmployeeRequests } from '../api/employee-requests.api';
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
