import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetConditionStatus, AssetIncidentType, AssetStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAssetCategoryDto {
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
}

export class CreateAssetDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetCode?: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: AssetConditionStatus })
  @IsOptional()
  @IsEnum(AssetConditionStatus)
  conditionStatus?: AssetConditionStatus;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  assetStatus?: AssetStatus;
}

export class AssignAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToDepartmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedReturnAt?: string;

  @ApiPropertyOptional({ enum: AssetConditionStatus })
  @IsOptional()
  @IsEnum(AssetConditionStatus)
  conditionWhenAssigned?: AssetConditionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReceiveReturnDto {
  @ApiProperty({ enum: AssetConditionStatus })
  @IsEnum(AssetConditionStatus)
  conditionWhenReturned!: AssetConditionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReportIncidentDto {
  @ApiProperty({ enum: AssetIncidentType })
  @IsEnum(AssetIncidentType)
  incidentType!: AssetIncidentType;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class ResolveIncidentDto {
  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  assetStatus?: AssetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}

export class MaintenanceDto {
  @ApiProperty()
  @IsString()
  maintenanceType!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorName?: string;
}
