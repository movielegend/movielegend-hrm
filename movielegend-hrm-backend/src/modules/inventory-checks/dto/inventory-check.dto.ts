import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class CreateInventoryCheckDto {
  @ApiProperty()
  @IsUUID()
  warehouseId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class InventoryCheckItemUpdateDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateInventoryCheckItemsDto {
  @ApiProperty({ type: [InventoryCheckItemUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryCheckItemUpdateDto)
  items!: InventoryCheckItemUpdateDto[];
}
