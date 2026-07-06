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
}

export class RejectCrossDepartmentRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
