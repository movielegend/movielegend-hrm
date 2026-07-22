import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

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
}
