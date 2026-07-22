import type { QueryClient } from '@tanstack/react-query';
import {
  assetKeys,
  inventoryCheckKeys,
  materialIssueKeys,
  queryKeys,
  stockKeys,
  transferKeys,
} from '../../constants/queryKeys';

// Socket chỉ invalidate query — REST vẫn là source of truth.
// Backend emit thật: `warehouse:stock-updated`, `material:issue-updated`, `inventory:updated`
// (room warehouse:{id}), `asset:assigned` (room user:{id}).

export interface WarehouseSocketPayload {
  warehouseId?: string;
  id?: string;
}

export interface MaterialIssueSocketPayload {
  id?: string;
  issueId?: string;
  warehouseId?: string;
}

export interface AssetSocketPayload {
  assetId?: string;
  id?: string;
  assignmentId?: string;
}

export interface IncidentSocketPayload {
  id?: string;
  incidentId?: string;
  assetId?: string;
}

export function invalidateForStockUpdated(queryClient: QueryClient, payload: WarehouseSocketPayload): void {
  if (payload.warehouseId) {
    void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(payload.warehouseId) });
  } else {
    void queryClient.invalidateQueries({ queryKey: stockKeys.all });
  }
  void queryClient.invalidateQueries({ queryKey: transferKeys.all });
}

export function invalidateForIssueUpdated(queryClient: QueryClient, payload: MaterialIssueSocketPayload): void {
  void queryClient.invalidateQueries({ queryKey: materialIssueKeys.all });
  const issueId = payload.issueId ?? payload.id;
  if (issueId) void queryClient.invalidateQueries({ queryKey: materialIssueKeys.detail(issueId) });
  if (payload.warehouseId) void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(payload.warehouseId) });
}

export function invalidateForAssetAssigned(queryClient: QueryClient, payload: AssetSocketPayload): void {
  void queryClient.invalidateQueries({ queryKey: assetKeys.my() });
  void queryClient.invalidateQueries({ queryKey: assetKeys.list() });
  const assetId = payload.assetId ?? payload.id;
  if (assetId) void queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
}

export function invalidateForAssetReturnUpdated(queryClient: QueryClient, payload: AssetSocketPayload): void {
  void queryClient.invalidateQueries({ queryKey: assetKeys.my() });
  void queryClient.invalidateQueries({ queryKey: assetKeys.list() });
  const assetId = payload.assetId ?? payload.id;
  if (assetId) void queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
}

export function invalidateForIncidentUpdated(queryClient: QueryClient, payload: IncidentSocketPayload): void {
  if (payload.assetId) void queryClient.invalidateQueries({ queryKey: assetKeys.detail(payload.assetId) });
}

export function invalidateForInventoryUpdated(queryClient: QueryClient, payload: WarehouseSocketPayload): void {
  void queryClient.invalidateQueries({ queryKey: inventoryCheckKeys.all });
  if (payload.warehouseId) void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(payload.warehouseId) });
}
