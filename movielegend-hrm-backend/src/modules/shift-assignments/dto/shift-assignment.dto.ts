import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class AssignShiftDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsUUID()
  departmentId!: string;

  @ApiProperty()
  @IsUUID()
  shiftId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  workDate!: string;

  @ApiPropertyOptional({ default: false, description: 'Cho phép ghi đè/điều chuyển ca nếu nhân sự đã được xếp ca trong ngày (chưa check-in)' })
  @IsOptional()
  @IsBoolean()
  allowOverwrite?: boolean;

  @ApiPropertyOptional({ description: 'Lý do điều chuyển hoặc vá ca' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BatchAssignShiftDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  userIds!: string[];

  @ApiProperty()
  @IsUUID()
  departmentId!: string;

  @ApiProperty()
  @IsUUID()
  shiftId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsDateString({}, { each: true })
  dates!: string[];

  @ApiPropertyOptional({ default: false, description: 'Cho phép ghi đè/điều chuyển ca nếu nhân sự đã được xếp ca trong ngày (chưa check-in)' })
  @IsOptional()
  @IsBoolean()
  allowOverwrite?: boolean;

  @ApiPropertyOptional({ description: 'Lý do điều chuyển hoặc vá ca' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DepartmentAssignmentsQueryDto {
  @ApiProperty()
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ type: String, format: 'date', description: 'Từ ngày (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ type: String, format: 'date', description: 'Đến ngày (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;
}

export class ShiftCellDeleteItemDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  workDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
}

export class BatchDeleteShiftCellsDto {
  @ApiProperty({ type: [ShiftCellDeleteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftCellDeleteItemDto)
  items!: ShiftCellDeleteItemDto[];
}

export class ShiftCellUpsertItemDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsUUID()
  departmentId!: string;

  @ApiProperty()
  @IsUUID()
  shiftId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  workDate!: string;
}

export class BatchUpsertShiftCellsDto {
  @ApiProperty({ type: [ShiftCellUpsertItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftCellUpsertItemDto)
  items!: ShiftCellUpsertItemDto[];
}


