import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  allowedRadius?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchDto {
  code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  allowedRadius?: number;
  isActive?: boolean;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Branch[]>>('/branches');
      return unwrapData(response);
    },
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: ['branches', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Branch>>(`/branches/${id}`);
      return unwrapData(response);
    },
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateBranchDto) => {
      const response = await apiClient.post<ApiResponse<Branch>>('/branches', dto);
      return unwrapData(response);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<CreateBranchDto> & { id: string }) => {
      const response = await apiClient.patch<ApiResponse<Branch>>(`/branches/${id}`, dto);
      return unwrapData(response);
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
      void queryClient.invalidateQueries({ queryKey: ['branches', id] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}
