import type { DecimalString, MaterialDto } from './material.types';
import type { WarehouseDto } from './warehouse.types';

export type StockReceiptStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'CANCELLED';

export type MaterialIssueTargetType = 'USER' | 'DEPARTMENT';

export type MaterialIssueStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ISSUING'
  | 'COMPLETED'
  | 'CANCELLED';

export type StockTransferStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WarehouseStockDto {
  id: string;
  warehouseId: string;
  materialId: string;
  quantityOnHand: DecimalString;
  quantityReserved: DecimalString;
  version: number;
  updatedAt: string;
  material?: MaterialDto;
}

export interface StockLinePayload {
  materialId: string;
  quantity: number;
  unitCost?: number;
  note?: string;
}

export interface StockReceiptItemDto {
  id: string;
  receiptId: string;
  materialId: string;
  quantity: DecimalString;
  unitCost?: DecimalString | null;
  note?: string | null;
  material?: MaterialDto;
}

export interface StockReceiptDto {
  id: string;
  receiptCode: string;
  warehouseId: string;
  supplierName?: string | null;
  referenceNumber?: string | null;
  receiptDate: string;
  status: StockReceiptStatus;
  note?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: StockReceiptItemDto[];
  warehouse?: WarehouseDto;
}

export interface CreateStockReceiptPayload {
  warehouseId: string;
  supplierName?: string;
  referenceNumber?: string;
  receiptDate?: string;
  note?: string;
  items: StockLinePayload[];
}

export interface MaterialIssueItemDto {
  id: string;
  materialIssueId: string;
  materialId: string;
  quantityRequested: DecimalString;
  quantityApproved: DecimalString;
  quantityIssued: DecimalString;
  note?: string | null;
  material?: MaterialDto;
}

export interface MaterialIssueDto {
  id: string;
  issueCode: string;
  warehouseId: string;
  issueTargetType: MaterialIssueTargetType;
  issuedToUserId?: string | null;
  issuedToDepartmentId?: string | null;
  status: MaterialIssueStatus;
  requestedById?: string | null;
  approvedById?: string | null;
  issuedById?: string | null;
  issueDate?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  items: MaterialIssueItemDto[];
}

export interface CreateMaterialIssuePayload {
  warehouseId: string;
  issueTargetType: MaterialIssueTargetType;
  issuedToUserId?: string;
  issuedToDepartmentId?: string;
  note?: string;
  items: StockLinePayload[];
}

export interface StockTransferItemDto {
  id: string;
  transferId: string;
  materialId: string;
  quantity: DecimalString;
  material?: MaterialDto;
}

export interface StockTransferDto {
  id: string;
  transferCode: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  status: StockTransferStatus;
  requestedById: string;
  approvedById?: string | null;
  shippedById?: string | null;
  receivedById?: string | null;
  shippedAt?: string | null;
  receivedAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  items: StockTransferItemDto[];
}

export interface CreateStockTransferPayload {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  note?: string;
  items: StockLinePayload[];
}

export interface RejectPayload {
  reason?: string;
}
