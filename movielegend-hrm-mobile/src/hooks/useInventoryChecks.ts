import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveInventoryCheck,
  createInventoryCheck,
  getInventoryCheck,
  getInventoryChecks,
  submitInventoryCheck,
  updateInventoryCheckItems,
} from '../api/inventory-checks.api';
import { assetKeys, inventoryCheckKeys, stockKeys } from '../constants/queryKeys';
import type { CreateInventoryCheckPayload, UpdateInventoryCheckItemsPayload } from '../types/inventory-check.types';

export function useInventoryChecks(enabled = true) {
  return useQuery({ queryKey: inventoryCheckKeys.list(), queryFn: getInventoryChecks, enabled });
}

export function useInventoryCheck(id?: string) {
  return useQuery({
    queryKey: inventoryCheckKeys.detail(id ?? 'missing'),
    queryFn: () => getInventoryCheck(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateInventoryCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInventoryCheckPayload) => createInventoryCheck(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryCheckKeys.all });
    },
  });
}

/** Nhập actual count — backend KHÔNG đổi stock ở bước này. */
export function useUpdateInventoryCheckItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInventoryCheckItemsPayload }) =>
      updateInventoryCheckItems(id, payload),
    onSuccess: (check) => {
      void queryClient.invalidateQueries({ queryKey: inventoryCheckKeys.detail(check.id) });
    },
  });
}

export function useSubmitInventoryCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitInventoryCheck(id),
    onSuccess: (check) => {
      void queryClient.invalidateQueries({ queryKey: inventoryCheckKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventoryCheckKeys.detail(check.id) });
    },
  });
}

/** Approve mới apply adjustment vào stock + asset status → invalidate stock + assets. */
export function useApproveInventoryCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveInventoryCheck(id),
    onSuccess: (check) => {
      void queryClient.invalidateQueries({ queryKey: inventoryCheckKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventoryCheckKeys.detail(check.id) });
      void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(check.warehouseId) });
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}
