import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closeWarehouse, createWarehouse, getWarehouse, getWarehouses, updateWarehouse } from '../api/warehouses.api';
import { getWarehouseStocks } from '../api/stocks.api';
import { stockKeys, warehouseKeys } from '../constants/queryKeys';
import type { CreateWarehousePayload, UpdateWarehousePayload } from '../types/warehouse.types';

export function useWarehouses(enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.list(),
    queryFn: getWarehouses,
    enabled,
  });
}

export function useWarehouse(id?: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? 'missing'),
    queryFn: () => getWarehouse(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useWarehouseStocks(warehouseId?: string) {
  return useQuery({
    queryKey: stockKeys.byWarehouse(warehouseId ?? 'missing'),
    queryFn: () => getWarehouseStocks(warehouseId ?? ''),
    enabled: Boolean(warehouseId),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehousePayload) => createWarehouse(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWarehousePayload }) => updateWarehouse(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.id) });
    },
  });
}

export function useCloseWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeWarehouse(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
}
