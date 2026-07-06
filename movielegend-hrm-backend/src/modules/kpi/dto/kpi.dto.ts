import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KpiPeriodType, KpiScoringMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class CreateKpiTemplateDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  positionId?: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: KpiPeriodType })
  @IsEnum(KpiPeriodType)
  periodType!: KpiPeriodType;
}

export class UpdateKpiTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateKpiCriteriaDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ enum: KpiScoringMethod })
  @IsEnum(KpiScoringMethod)
  scoringMethod!: KpiScoringMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class CreateKpiAssignmentDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsUUID()
  kpiTemplateId!: string;

  @ApiProperty()
  @IsDateString()
  periodStart!: string;

  @ApiProperty()
  @IsDateString()
  periodEnd!: string;
}

export class UpdateKpiResultItemDto {
  @ApiProperty()
  @IsUUID()
  criteriaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  employeeScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  leaderScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  finalScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeComment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leaderComment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  finalComment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class UpdateKpiResultsDto {
  @ApiProperty({ type: [UpdateKpiResultItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateKpiResultItemDto)
  results!: UpdateKpiResultItemDto[];
}
