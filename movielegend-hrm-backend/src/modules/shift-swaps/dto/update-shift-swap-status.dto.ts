import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ShiftSwapStatus } from '@prisma/client';

export class UpdateShiftSwapStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(ShiftSwapStatus)
  @IsNotEmpty()
  status!: ShiftSwapStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
