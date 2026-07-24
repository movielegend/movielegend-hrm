import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractType, SignatureType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, IsArray } from 'class-validator';

export class CreateContractTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: ContractType })
  @IsEnum(ContractType)
  contractType!: ContractType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  templateFileUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageKey?: string;
}

export class UpdateContractTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateFileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageKey?: string;
}

export class UpdateTemplateMappingDto {
  @ApiProperty()
  @IsArray()
  mappingConfig!: any[];
}

export class CreateEmployeeContractDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsUUID()
  contractTemplateId!: string;

  @ApiProperty()
  @IsUUID()
  contractTemplateVersionId!: string;

  @ApiProperty({ enum: ContractType })
  @IsEnum(ContractType)
  contractType!: ContractType;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  draftFileUrl?: string;
}

export class UpdateEmployeeContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  draftFileUrl?: string;
}

export class RejectContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SignContractDto {
  @ApiProperty({ enum: SignatureType })
  @IsEnum(SignatureType)
  signatureType!: SignatureType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureData?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signedFileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  filledFields?: Record<string, any>;
}

export class TerminateContractDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class ScanContractDto {
  @ApiProperty()
  @IsString()
  imageUrl!: string;
}
