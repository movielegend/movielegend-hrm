export declare class CreateBranchDto {
    code: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    allowedRadius?: number;
    isActive?: boolean;
    departmentIds?: string[];
    allowedIps?: string[];
}
export declare class UpdateBranchDto extends CreateBranchDto {
}
