import { AssetConditionStatus, AssetIncidentType, AssetStatus } from '@prisma/client';
export declare class CreateAssetDto {
    departmentId?: string;
    conditionNote?: string;
    assetCode?: string;
    name: string;
    brand?: string;
    model?: string;
    imageUrl?: string;
}
export declare class UpdateAssetDto {
    name?: string;
    conditionStatus?: AssetConditionStatus;
    assetStatus?: AssetStatus;
    departmentId?: string;
    conditionNote?: string;
    imageUrl?: string;
}
export declare class TransferAssetDto {
    targetDepartmentId: string;
    note?: string;
}
export declare class AssignAssetDto {
    assignedToUserId?: string;
    assignedToDepartmentId?: string;
    expectedReturnAt?: string;
    conditionWhenAssigned?: AssetConditionStatus;
    note?: string;
}
export declare class ReceiveReturnDto {
    conditionWhenReturned: AssetConditionStatus;
    note?: string;
}
export declare class ReportIncidentDto {
    incidentType: AssetIncidentType;
    description: string;
    evidenceUrl?: string;
}
export declare class ResolveIncidentDto {
    assetStatus?: AssetStatus;
    resolutionNote?: string;
}
export declare class MaintenanceDto {
    maintenanceType: string;
    description: string;
    vendorName?: string;
}
