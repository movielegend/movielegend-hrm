import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrUpdateDeptOvertimeConfigDto {
  @ApiProperty()
  @IsString()
  departmentId!: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weekdayMultiplier?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weekendMultiplier?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  holidayMultiplier?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  nightAllowanceAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  nightStartHour?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lateDeductionAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lateThresholdMinutes?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
