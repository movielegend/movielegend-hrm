export declare class CreateMaterialCategoryDto {
    code: string;
    name: string;
    description?: string;
}
export declare class CreateMaterialDto {
    categoryId: string;
    materialCode?: string;
    name: string;
    description?: string;
    unit: string;
    minimumStock?: number;
    maximumStock?: number;
}
export declare class UpdateMaterialDto {
    name?: string;
    description?: string;
    unit?: string;
    minimumStock?: number;
    maximumStock?: number;
}
