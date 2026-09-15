import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface DepartmentDocument {
  id: string;
  companyId: string;
  departmentId?: string | null;
  title: string;
  description?: string | null;
  category: string;
  fileName: string;
  fileUrl: string;
  storageKey?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadedById: string;
  createdAt: string;
  department?: {
    id: string;
    name: string;
    code: string;
    branch?: {
      id: string;
      name: string;
      code: string;
      region?: {
        id: string;
        name: string;
        code: string;
      };
    };
  } | null;
  uploadedBy?: {
    id: string;
    fullName?: string;
    userCode?: string;
    phone?: string;
    profile?: {
      fullName?: string;
      avatarUrl?: string;
    } | null;
  } | null;
}

export interface CreateDepartmentDocumentDto {
  departmentId?: string;
  title: string;
  description?: string;
  category?: string;
  fileName: string;
  fileUrl: string;
  storageKey?: string;
  fileId?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface QueryDepartmentDocumentsDto {
  departmentId?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DepartmentDocumentListResponse {
  items: DepartmentDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useDepartmentDocuments(query?: QueryDepartmentDocumentsDto) {
  return useQuery({
    queryKey: ['department-documents', query],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DepartmentDocumentListResponse>>('/department-documents', {
        params: query,
      });
      return unwrapData(response);
    },
  });
}

export function useDepartmentDocument(id: string) {
  return useQuery({
    queryKey: ['department-documents', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DepartmentDocument>>(`/department-documents/${id}`);
      return unwrapData(response);
    },
    enabled: !!id,
  });
}

export function useCreateDepartmentDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateDepartmentDocumentDto) => {
      const response = await apiClient.post<ApiResponse<DepartmentDocument>>('/department-documents', dto);
      return unwrapData(response);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['department-documents'] });
    },
  });
}

export function useDeleteDepartmentDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<DepartmentDocument>>(`/department-documents/${id}`);
      return unwrapData(response);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['department-documents'] });
    },
  });
}
