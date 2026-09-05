import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class GrantVaultPointsDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  points!: number;

  @ApiPropertyOptional({ default: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2026;

  @ApiPropertyOptional({ default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cashValuePerPoint?: number = 1000;
}

export class BulkGrantVaultPointsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  userIds?: string[];

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  points!: number;

  @ApiPropertyOptional({ default: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = 2026;

  @ApiPropertyOptional({ default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cashValuePerPoint?: number = 1000;
}
