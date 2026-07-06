import { MaterialIssueTargetType } from '@prisma/client';
export declare class StockLineDto {
    materialId: string;
    quantity: number;
    unitCost?: number;
    note?: string;
}
export declare class CreateStockReceiptDto {
    warehouseId: string;
    supplierName?: string;
    referenceNumber?: string;
    receiptDate?: string;
    note?: string;
    items: StockLineDto[];
}
export declare class CreateMaterialIssueDto {
    warehouseId: string;
    issueTargetType: MaterialIssueTargetType;
    issuedToUserId?: string;
    issuedToDepartmentId?: string;
    note?: string;
    items: StockLineDto[];
}
export declare class CreateStockTransferDto {
    sourceWarehouseId: string;
    targetWarehouseId: string;
    note?: string;
    items: StockLineDto[];
}
export declare class RejectDto {
    reason?: string;
}
