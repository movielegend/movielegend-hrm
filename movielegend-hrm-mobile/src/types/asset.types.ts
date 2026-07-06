import type { DecimalString } from './material.types';
import type { AssetAssignmentDto } from './asset-assignment.types';
import type { AssetIncidentDto } from './asset-incident.types';

export type AssetStatus =
  | 'IN_STOCK'
  | 'ASSIGNED'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'LOST'
  | 'DAMAGED'
  | 'DISPOSED'
  | 'TRANSFER_PENDING';

export type AssetConditionStatus = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';

export type AssetMaintenanceStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface AssetCategoryDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface AssetDto {
  id: string;
  assetCode: string;
  categoryId: string;
  warehouseId?: string | null;
  name: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: DecimalString | null;
  warrantyEndDate?: string | null;
  conditionStatus: AssetConditionStatus;
  assetStatus: AssetStatus;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: AssetAssignmentDto[];
  incidents?: AssetIncidentDto[];
}

/** Actual CreateAssetDto — backend chỉ nhận đúng các field này (forbidNonWhitelisted). */
export interface CreateAssetPayload {
  categoryId: string;
  warehouseId?: string;
  assetCode?: string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
}

export interface UpdateAssetPayload {
  name?: string;
  conditionStatus?: AssetConditionStatus;
  assetStatus?: AssetStatus;
}

export interface CreateAssetCategoryPayload {
  code: string;
  name: string;
  description?: string;
}

export interface AssetMaintenanceDto {
  id: string;
  assetId: string;
  maintenanceType: string;
  vendorName?: string | null;
  description: string;
  cost?: DecimalString | null;
  startedAt: string;
  completedAt?: string | null;
  status: AssetMaintenanceStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartMaintenancePayload {
  maintenanceType: string;
  description: string;
  vendorName?: string;
}
