import type { InventoryCheckDto, InventoryCheckItemDto, InventoryCheckStatus } from '../../types/inventory-check.types';
import { toQuantity } from '../../utils/quantity';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const inventoryStatusLabels: Record<InventoryCheckStatus, string> = {
  DRAFT: 'Nháp',
  IN_PROGRESS: 'Đang kiểm kê',
  SUBMITTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
};

export function inventoryStatusTone(status: InventoryCheckStatus): BadgeTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'SUBMITTED') return 'warning';
  if (status === 'IN_PROGRESS') return 'info';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

/**
 * Difference chỉ để hiển thị — backend tự tính khi PATCH items và
 * chỉ apply adjustment khi approve. Mobile không mutate stock.
 */
export function displayDifference(item: Pick<InventoryCheckItemDto, 'systemQuantity' | 'actualQuantity' | 'differenceQuantity'>): number {
  if (item.differenceQuantity !== null && typeof item.differenceQuantity !== 'undefined') {
    return toQuantity(item.differenceQuantity);
  }
  return toQuantity(item.actualQuantity) - toQuantity(item.systemQuantity);
}

export interface InventoryDifferenceSummary {
  materialItems: number;
  assetItems: number;
  increased: number;
  decreased: number;
  assetStatusChanges: number;
}

export function summarizeDifferences(check: Pick<InventoryCheckDto, 'items'>): InventoryDifferenceSummary {
  const summary: InventoryDifferenceSummary = { materialItems: 0, assetItems: 0, increased: 0, decreased: 0, assetStatusChanges: 0 };
  for (const item of check.items) {
    if (item.materialId) {
      summary.materialItems += 1;
      const diff = displayDifference(item);
      if (diff > 0) summary.increased += 1;
      if (diff < 0) summary.decreased += 1;
    }
    if (item.assetId) {
      summary.assetItems += 1;
      if (item.actualAssetStatus && item.actualAssetStatus !== item.expectedAssetStatus) summary.assetStatusChanges += 1;
    }
  }
  return summary;
}

export function isEditable(check: Pick<InventoryCheckDto, 'status'>): boolean {
  return check.status === 'IN_PROGRESS';
}
