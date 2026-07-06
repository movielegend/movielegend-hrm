export declare class PositionQueryDto {
    departmentId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class CreatePositionDto {
    departmentId?: string;
    code: string;
    name: string;
    description?: string;
}
declare const UpdatePositionDto_base: import("@nestjs/common").Type<Partial<CreatePositionDto>>;
export declare class UpdatePositionDto extends UpdatePositionDto_base {
    isActive?: boolean;
}
export {};
