export declare class CreateBranchDto {
    code: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    allowedRadius?: number;
    isActive?: boolean;
}
export declare class UpdateBranchDto extends CreateBranchDto {
}
