export declare class CreateBonusDto {
    userId: string;
    bonusType: string;
    title: string;
    description?: string;
    amount: number;
    effectiveDate: string;
}
export declare class CreateDeductionDto {
    userId: string;
    deductionType: string;
    title: string;
    description?: string;
    amount: number;
    effectiveDate: string;
}
export declare class RejectCompensationDto {
    reason?: string;
}
