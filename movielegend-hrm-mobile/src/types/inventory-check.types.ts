import type { DecimalString } from './material.types';
import type { AssetStatus } from './asset.types';

export type InventoryCheckStatus = 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'CANCELLED';

export interface InventoryCheckItemDto {
  id: string;
  inventoryCheckId: string;
  materialId?: string | null;
  assetId?: string | null;
  systemQuantity?: DecimalString | null;
  actualQuantity?: DecimalString | null;
  differenceQuantity?: DecimalString | null;
  expectedAssetStatus?: AssetStatus | null;
  actualAssetStatus?: AssetStatus | null;
  note?: string | null;
}

export interface InventoryCheckDto {
  id: string;
  warehouseId: string;
  checkCode: string;
  status: InventoryCheckStatus;
  startedAt: string;
  completedAt?: string | null;
  createdById: string;
  approvedById?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  items: InventoryCheckItemDto[];
}

export interface CreateInventoryCheckPayload {
  warehouseId: string;
  note?: string;
}

export interface InventoryCheckItemUpdatePayload {
  id: string;
  actualQuantity?: number;
  actualAssetStatus?: AssetStatus;
  note?: string;
}

export interface UpdateInventoryCheckItemsPayload {
  items: InventoryCheckItemUpdatePayload[];
}
