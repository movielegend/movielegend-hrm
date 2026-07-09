import { DisciplinaryActionType } from '@prisma/client';
export declare class CreateViolationDto {
    userId: string;
    violationType: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    title: string;
    description: string;
    violationDate: string;
}
export declare class CreateDisciplinaryActionDto {
    actionType: DisciplinaryActionType;
    amount?: number;
    description: string;
    effectiveDate: string;
}
