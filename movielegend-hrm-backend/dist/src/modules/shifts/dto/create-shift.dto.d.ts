export declare class CreateShiftDto {
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    checkInEarlyMinutes?: number;
    checkInLateMinutes?: number;
    isNightShift?: boolean;
}
declare const UpdateShiftDto_base: import("@nestjs/common").Type<Partial<CreateShiftDto>>;
export declare class UpdateShiftDto extends UpdateShiftDto_base {
    isActive?: boolean;
}
export {};
