import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface Region {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Region[]>>('/regions');
      return unwrapData(response);
    },
  });
}

export function useRegion(id: string) {
  return useQuery({
    queryKey: ['regions', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Region>>(`/regions/${id}`);
      return unwrapData(response);
    },
    enabled: !!id,
  });
}
