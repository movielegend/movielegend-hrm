export declare class CreateInventoryCheckDto {
    warehouseId: string;
    note?: string;
}
export declare class InventoryCheckItemUpdateDto {
    id: string;
    actualQuantity?: number;
    note?: string;
}
export declare class UpdateInventoryCheckItemsDto {
    items: InventoryCheckItemUpdateDto[];
}
