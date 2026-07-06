import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMaterial,
  createMaterialCategory,
  getMaterial,
  getMaterialCategories,
  getMaterials,
  updateMaterial,
} from '../api/materials.api';
import { materialKeys } from '../constants/queryKeys';
import type { CreateMaterialCategoryPayload, CreateMaterialPayload, UpdateMaterialPayload } from '../types/material.types';

export function useMaterialCategories(enabled = true) {
  return useQuery({
    queryKey: materialKeys.categories(),
    queryFn: getMaterialCategories,
    enabled,
  });
}

export function useMaterials(enabled = true) {
  return useQuery({
    queryKey: materialKeys.list(),
    queryFn: getMaterials,
    enabled,
  });
}

export function useMaterial(id?: string) {
  return useQuery({
    queryKey: materialKeys.detail(id ?? 'missing'),
    queryFn: () => getMaterial(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateMaterialCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialCategoryPayload) => createMaterialCategory(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.categories() });
    },
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialPayload) => createMaterial(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialPayload }) => updateMaterial(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
      void queryClient.invalidateQueries({ queryKey: materialKeys.detail(variables.id) });
    },
  });
}
