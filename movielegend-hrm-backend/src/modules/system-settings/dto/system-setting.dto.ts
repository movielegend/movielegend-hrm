import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemSettingCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpsertSystemSettingDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsObject()
  valueJson!: Record<string, unknown>;

  @ApiProperty({ enum: SystemSettingCategory })
  @IsEnum(SystemSettingCategory)
  category!: SystemSettingCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSensitive?: boolean;
}
