import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class LeaderAssignmentDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  primary?: boolean;
}
