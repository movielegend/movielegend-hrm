import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCrossDepartmentRequestDto {
  @ApiProperty()
  @IsUUID()
  sourceDepartmentId!: string;

  @ApiProperty()
  @IsUUID()
  targetDepartmentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueAt?: string;
}

export class RejectCrossDepartmentRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class AssignTargetDto {
  @ApiProperty()
  @IsUUID()
  assignedToUserId!: string;
}

export class UpdateProgressDto {
  @ApiProperty()
  progress!: number;
}

export class SubmitDeliverableDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resultSummary?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  rating?: number;
}
