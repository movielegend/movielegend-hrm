import { AssetStatus } from '@prisma/client';
export declare class CreateInventoryCheckDto {
    warehouseId: string;
    note?: string;
}
export declare class InventoryCheckItemUpdateDto {
    id: string;
    actualQuantity?: number;
    actualAssetStatus?: AssetStatus;
    note?: string;
}
export declare class UpdateInventoryCheckItemsDto {
    items: InventoryCheckItemUpdateDto[];
}
