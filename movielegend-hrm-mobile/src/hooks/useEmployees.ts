import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminUser, getEmployeeReport, getEmployees, getScopedEmployees, updateEmployee } from '../api/employees.api';
import { queryKeys } from '../constants/queryKeys';
import type { EmployeeListFilters, ScopedEmployeeFilters, UpdateEmployeePayload } from '../types/employee.types';

export function useEmployees(filters: EmployeeListFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees(filters),
    queryFn: () => getEmployees(filters),
    enabled,
  });
}

export function useEmployeeReport(filters: EmployeeListFilters) {
  return useQuery({
    queryKey: queryKeys.employeeReport(filters),
    queryFn: () => getEmployeeReport(filters),
  });
}

export function useScopedEmployees(filters: ScopedEmployeeFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.scopedEmployees(filters),
    queryFn: () => getScopedEmployees(filters),
    enabled,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: () => getAdminUser(id),
    enabled: Boolean(id),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEmployeePayload) => updateEmployee(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.employee(id) });
    },
  });
}
