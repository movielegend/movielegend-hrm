import { apiClient, unwrapData } from '../api/client';
import { normalizePagination } from '../types/pagination.types';
import type { ApiResponse } from '../types/api.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAsset, getAsset, getAssets, getMyAssets, updateAsset, transferAsset, revokeAsset } from '../api/assets.api';
import { assignAsset, confirmAssetAssignment, receiveAssetReturn, requestAssetReturn } from '../api/asset-assignments.api';
import { completeAssetMaintenance, startAssetMaintenance } from '../api/asset-maintenance.api';
import { assetKeys, maintenanceKeys, queryKeys } from '../constants/queryKeys';
import type { CreateAssetPayload, StartMaintenancePayload, UpdateAssetPayload, AssetMaintenanceDto } from '../types/asset.types';
import type { AssignAssetPayload, ReceiveReturnPayload } from '../types/asset-assignment.types';

export function useAssets(enabled = true) {
  return useQuery({ queryKey: assetKeys.list(), queryFn: getAssets, enabled });
}

export function useMyAssets(enabled = true) {
  return useQuery({ queryKey: assetKeys.my(), queryFn: getMyAssets, enabled });
}

export function useAsset(id?: string) {
  return useQuery({
    queryKey: assetKeys.detail(id ?? 'missing'),
    queryFn: () => getAsset(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetPayload) => createAsset(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssetPayload }) => updateAsset(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
    },
  });
}



/** Assign: invalidate asset list/detail + my assets (bên nhận) + notifications. */
export function useAssignAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: AssignAssetPayload }) => assignAsset(assetId, payload),
    onSuccess: (assignment) => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(assignment.assetId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
    },
  });
}

export function useTransferAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: { targetDepartmentId: string; note?: string } }) => transferAsset(assetId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useRevokeAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: { note?: string } }) => revokeAsset(assetId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

/** Confirm: my assets + asset detail + notifications. */
export function useConfirmAssetAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => confirmAssetAssignment(assignmentId),
    onSuccess: (assignment) => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.my() });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(assignment.assetId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}

export function useRequestAssetReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: { reason: string } }) => requestAssetReturn(assignmentId, payload),
    onSuccess: (assignment) => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.my() });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(assignment.assetId) });
    },
  });
}

/** Receive return: assignment + asset + my assets — asset state cuối do backend quyết định. */
export function useReceiveAssetReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: ReceiveReturnPayload }) =>
      receiveAssetReturn(assignmentId, payload),
    onSuccess: (assignment) => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(assignment.assetId) });
      void queryClient.invalidateQueries({ queryKey: assetKeys.my() });
    },
  });
}

/**
 * Start maintenance: backend không có GET maintenance (blocker B2) —
 * cache record trả về theo asset để còn complete được trong session.
 */
export function useStartAssetMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: StartMaintenancePayload }) =>
      startAssetMaintenance(assetId, payload),
    onSuccess: (record) => {
      queryClient.setQueryData(maintenanceKeys.activeByAsset(record.assetId), record);
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(record.assetId) });
    },
  });
}

export function useActiveMaintenanceRecord(assetId?: string): AssetMaintenanceDto | null {
  const queryClient = useQueryClient();
  if (!assetId) return null;
  return queryClient.getQueryData<AssetMaintenanceDto>(maintenanceKeys.activeByAsset(assetId)) ?? null;
}

export function useCompleteAssetMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, payload }: { recordId: string; payload: ReceiveReturnPayload }) =>
      completeAssetMaintenance(recordId, payload),
    onSuccess: (record) => {
      queryClient.removeQueries({ queryKey: maintenanceKeys.activeByAsset(record.assetId) });
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(record.assetId) });
    },
  });
}

export function useAssetDepartments(filters: { search?: string } = {}) {
  return useQuery({
    queryKey: ['asset-departments', filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<any>>('/admin/assets/departments', { params: { search: filters.search } });
      return normalizePagination(response);
    }
  });
}
