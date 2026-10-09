import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkTaskDto {
  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMakeup?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  makeupForDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  makeupReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proxyForUserId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  initialProgress?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialObstacles?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialSupportRequest?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isTestBypass?: boolean;
}

export class UpdateWorkTaskDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;
  
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateWorkTaskUpdateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportDate?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  obstacles?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supportRequest?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isProxied?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proxyReason?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isTestBypass?: boolean;
}

export class ApproveWorkTaskUpdateDto {
  @ApiProperty()
  @IsString()
  approvalStatus!: 'APPROVED' | 'NEED_MORE_INFO';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalNote?: string;
}

export class AdminUpdateWorkTaskDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class TransferWorkTaskDto {
  @ApiProperty()
  @IsString()
  newUserId!: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class QueryWorkTasksDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: any;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

export class BulkSaveItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  obstacles?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supportRequest?: string;
}

export class BulkSaveWorkReportsDto {
  @ApiProperty({ type: [BulkSaveItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkSaveItemDto)
  items!: BulkSaveItemDto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  date?: string;
}

