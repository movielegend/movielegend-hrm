import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, EmploymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5000)
  limit?: number = 100;
}

export class EmployeeReportQueryDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() companyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() positionId?: string;
  @ApiPropertyOptional({ enum: EmploymentStatus }) @IsOptional() @IsEnum(EmploymentStatus) employmentStatus?: EmploymentStatus;
  @ApiPropertyOptional({ enum: AccountStatus }) @IsOptional() @IsEnum(AccountStatus) accountStatus?: AccountStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() joinDateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() joinDateTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}

export class DateRangeReportQueryDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class KpiReportQueryDto extends DateRangeReportQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() templateId?: string;
}
