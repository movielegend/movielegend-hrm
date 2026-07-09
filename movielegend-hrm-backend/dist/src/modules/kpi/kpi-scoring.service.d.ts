import { KpiScoringMethod, Prisma } from '@prisma/client';
export interface WeightedScoreInput {
    weight: Prisma.Decimal | number | string;
    score?: Prisma.Decimal | number | string | null;
}
export declare class KpiScoringService {
    validateWeightTotal(items: Array<{
        weight: Prisma.Decimal | number | string;
    }>): void;
    calculateWeightedScore(items: WeightedScoreInput[]): {
        score: number;
        explanation: {
            score: number;
            weight: number;
            weighted: number;
        }[];
    };
    scoreByMethod(method: KpiScoringMethod, actual?: string | null, target?: string | null, manualScore?: number | null): number;
    private clamp;
}
