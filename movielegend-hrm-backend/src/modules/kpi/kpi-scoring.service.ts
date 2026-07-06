import { Injectable } from '@nestjs/common';
import { KpiScoringMethod, Prisma } from '@prisma/client';
import { badRequest } from '../../common/utils/error.util';

export interface WeightedScoreInput {
  weight: Prisma.Decimal | number | string;
  score?: Prisma.Decimal | number | string | null;
}

@Injectable()
export class KpiScoringService {
  validateWeightTotal(items: Array<{ weight: Prisma.Decimal | number | string }>): void {
    const total = items.reduce((sum, item) => sum + Number(item.weight), 0);
    if (Math.abs(total - 100) > 0.001) {
      throw badRequest('KPI_WEIGHT_TOTAL_INVALID', 'KPI criteria weight total must equal 100');
    }
  }

  calculateWeightedScore(items: WeightedScoreInput[]) {
    const total = items.reduce((sum, item) => sum + this.clamp(Number(item.score ?? 0)) * Number(item.weight) / 100, 0);
    return {
      score: Math.round(total * 100) / 100,
      explanation: items.map((item) => ({
        score: this.clamp(Number(item.score ?? 0)),
        weight: Number(item.weight),
        weighted: Math.round((this.clamp(Number(item.score ?? 0)) * Number(item.weight) / 100) * 100) / 100,
      })),
    };
  }

  scoreByMethod(method: KpiScoringMethod, actual?: string | null, target?: string | null, manualScore?: number | null): number {
    if (manualScore !== undefined && manualScore !== null) return this.clamp(manualScore);
    if (method === KpiScoringMethod.BOOLEAN) return actual === 'true' ? 100 : 0;
    if (method === KpiScoringMethod.PERCENTAGE) return this.clamp(Number(actual ?? 0));
    if (method === KpiScoringMethod.TARGET_RATIO) {
      const targetNumber = Number(target ?? 0);
      if (!targetNumber) return 0;
      return this.clamp((Number(actual ?? 0) / targetNumber) * 100);
    }
    return 0;
  }

  private clamp(score: number): number {
    if (Number.isNaN(score)) return 0;
    return Math.min(100, Math.max(0, score));
  }
}
