import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDepartment, getDepartment, getDepartments, updateDepartment, type DepartmentFilters } from '../api/departments.api';
import { queryKeys } from '../constants/queryKeys';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from '../types/department.types';

export function useDepartments(filters: DepartmentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.departments(filters),
    queryFn: () => getDepartments(filters),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: queryKeys.department(id),
    queryFn: () => getDepartment(id),
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) => updateDepartment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.department(id) });
    },
  });
}
