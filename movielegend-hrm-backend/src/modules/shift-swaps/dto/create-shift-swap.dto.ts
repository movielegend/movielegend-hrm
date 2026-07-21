import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateShiftSwapDto {
  @IsNotEmpty({ message: 'Ca làm việc muốn đổi không được để trống' })
  @IsUUID('4', { message: 'Ca làm việc không hợp lệ' })
  fromShiftAssignmentId!: string;

  @IsNotEmpty({ message: 'Người đổi cùng không được để trống' })
  @IsUUID('4', { message: 'Người đổi cùng không hợp lệ' })
  targetUserId!: string;

  @IsNotEmpty({ message: 'Ca làm việc của người đổi cùng không được để trống' })
  @IsUUID('4', { message: 'Ca làm việc của người đổi cùng không hợp lệ' })
  toShiftAssignmentId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
