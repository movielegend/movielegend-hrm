import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID, MinLength } from 'class-validator';

export class ShiftRegistrationDto {
  @ApiProperty()
  @IsUUID()
  shiftId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  workDate!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason!: string;
}

export class ShiftSwapDto {
  @ApiProperty()
  @IsUUID()
  targetUserId!: string;

  @ApiProperty()
  @IsUUID()
  fromShiftId!: string;

  @ApiProperty()
  @IsUUID()
  toShiftId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  toDate!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason!: string;
}
