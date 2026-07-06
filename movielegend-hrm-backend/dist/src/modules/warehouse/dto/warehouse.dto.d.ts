export declare class CreateWarehouseDto {
    companyId: string;
    branchId?: string;
    departmentId?: string;
    code?: string;
    name: string;
    description?: string;
    address?: string;
    managerUserId?: string;
}
export declare class UpdateWarehouseDto {
    name?: string;
    description?: string;
    address?: string;
    managerUserId?: string;
    isActive?: boolean;
}
