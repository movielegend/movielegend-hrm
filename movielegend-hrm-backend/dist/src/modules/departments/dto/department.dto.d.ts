export declare class CreateDepartmentDto {
    companyId?: string;
    branchId?: string;
    parentId?: string;
    code: string;
    name: string;
    description?: string;
}
declare const UpdateDepartmentDto_base: import("@nestjs/common").Type<Partial<CreateDepartmentDto>>;
export declare class UpdateDepartmentDto extends UpdateDepartmentDto_base {
    isActive?: boolean;
}
export {};
