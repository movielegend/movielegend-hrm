import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum GrantVaultType {
  ANNUAL = 'ANNUAL',
  PROJECT_INSTANT = 'PROJECT_INSTANT',
  PROJECT_VESTING = 'PROJECT_VESTING',
}

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

  @ApiPropertyOptional({ enum: GrantVaultType, default: GrantVaultType.ANNUAL })
  @IsOptional()
  @IsEnum(GrantVaultType)
  grantType?: GrantVaultType = GrantVaultType.ANNUAL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
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

  @ApiPropertyOptional({ enum: GrantVaultType, default: GrantVaultType.ANNUAL })
  @IsOptional()
  @IsEnum(GrantVaultType)
  grantType?: GrantVaultType = GrantVaultType.ANNUAL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class WithdrawVaultPointsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  points!: number;

  @ApiProperty()
  @IsString()
  bankName!: string;

  @ApiProperty()
  @IsString()
  bankAccountNumber!: string;

  @ApiProperty()
  @IsString()
  bankAccountName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminApproveWithdrawalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AccountantConfirmWithdrawalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectWithdrawalDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class WithdrawalQueryDto {
  @ApiPropertyOptional({ enum: ['ALL', 'PENDING_ADMIN', 'PENDING_ACCOUNTANT', 'PAID', 'REJECTED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}
