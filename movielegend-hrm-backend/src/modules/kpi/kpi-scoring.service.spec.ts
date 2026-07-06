import { BadRequestException } from '@nestjs/common';
import { KpiScoringMethod, Prisma } from '@prisma/client';
import { KpiScoringService } from './kpi-scoring.service';

describe('KpiScoringService', () => {
  const scoring = new KpiScoringService();

  it('validates criteria weights equal 100', () => {
    expect(() => scoring.validateWeightTotal([{ weight: new Prisma.Decimal(40) }, { weight: new Prisma.Decimal(60) }])).not.toThrow();
    expect(() => scoring.validateWeightTotal([{ weight: new Prisma.Decimal(40) }])).toThrow(BadRequestException);
  });

  it('calculates weighted score and clamps input scores', () => {
    const result = scoring.calculateWeightedScore([
      { weight: 50, score: 120 },
      { weight: 50, score: 80 },
    ]);
    expect(result.score).toBe(90);
  });

  it('supports task-independent scoring strategies', () => {
    expect(scoring.scoreByMethod(KpiScoringMethod.BOOLEAN, 'true')).toBe(100);
    expect(scoring.scoreByMethod(KpiScoringMethod.PERCENTAGE, '120')).toBe(100);
    expect(scoring.scoreByMethod(KpiScoringMethod.TARGET_RATIO, '5', '10')).toBe(50);
  });
});
