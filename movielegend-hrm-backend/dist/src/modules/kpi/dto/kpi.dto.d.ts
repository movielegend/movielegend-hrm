import { KpiPeriodType, KpiScoringMethod } from '@prisma/client';
export declare class CreateKpiTemplateDto {
    companyId: string;
    departmentId?: string;
    positionId?: string;
    code: string;
    name: string;
    description?: string;
    periodType: KpiPeriodType;
}
export declare class UpdateKpiTemplateDto {
    name?: string;
    description?: string;
}
export declare class CreateKpiCriteriaDto {
    code: string;
    name: string;
    description?: string;
    weight: number;
    targetValue?: string;
    unit?: string;
    scoringMethod: KpiScoringMethod;
    sortOrder?: number;
}
export declare class CreateKpiAssignmentDto {
    userId: string;
    kpiTemplateId: string;
    periodStart: string;
    periodEnd: string;
}
export declare class UpdateKpiResultItemDto {
    criteriaId: string;
    actualValue?: string;
    employeeScore?: number;
    leaderScore?: number;
    finalScore?: number;
    employeeComment?: string;
    leaderComment?: string;
    finalComment?: string;
    evidenceUrl?: string;
}
export declare class UpdateKpiResultsDto {
    results: UpdateKpiResultItemDto[];
}
