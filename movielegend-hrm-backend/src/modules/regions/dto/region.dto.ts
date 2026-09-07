import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ description: 'Mã vùng miền, ví dụ: MIEN_NAM, MIEN_BAC' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Tên vùng miền, ví dụ: Miền Nam, Miền Bắc' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRegionDto extends CreateRegionDto {}
