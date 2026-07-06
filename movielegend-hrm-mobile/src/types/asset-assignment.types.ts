import type { AssetConditionStatus, AssetStatus } from './asset.types';
import type { AssetIncidentDto } from './asset-incident.types';

export type AssetAssignmentStatus =
  | 'PENDING_CONFIRMATION'
  | 'ACTIVE'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'CANCELLED';

export interface AssetAssignmentDto {
  id: string;
  assetId: string;
  assignedToUserId?: string | null;
  assignedToDepartmentId?: string | null;
  assignedById: string;
  assignedAt: string;
  expectedReturnAt?: string | null;
  returnedAt?: string | null;
  conditionWhenAssigned: AssetConditionStatus;
  conditionWhenReturned?: AssetConditionStatus | null;
  status: AssetAssignmentStatus;
  receiverConfirmedAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape trả về từ GET /assets/my — assignment kèm asset subset. */
export interface MyAssetAssignmentDto extends AssetAssignmentDto {
  asset: {
    assetCode: string;
    name: string;
    serialNumber?: string | null;
    conditionStatus: AssetConditionStatus;
    assetStatus: AssetStatus;
    incidents: AssetIncidentDto[];
  };
}

export interface AssignAssetPayload {
  assignedToUserId?: string;
  assignedToDepartmentId?: string;
  expectedReturnAt?: string;
  conditionWhenAssigned?: AssetConditionStatus;
  note?: string;
}

export interface ReceiveReturnPayload {
  conditionWhenReturned: AssetConditionStatus;
  note?: string;
}
