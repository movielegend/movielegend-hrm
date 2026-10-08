import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum AccountantRoleType {
  ACCOUNTANT_LEAD = 'ACCOUNTANT_LEAD',
  ACCOUNTANT_PAYROLL = 'ACCOUNTANT_PAYROLL',
  ACCOUNTANT_TAX = 'ACCOUNTANT_TAX',
  ACCOUNTANT_GENERAL = 'ACCOUNTANT_GENERAL',
}

export class AccountantAssignmentDto {
  @ApiProperty({ description: 'ID người dùng được bổ nhiệm' })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    enum: AccountantRoleType,
    description: 'Chức năng kế toán (ACCOUNTANT_LEAD: Kế toán trưởng, ACCOUNTANT_PAYROLL: Kế toán lương, ACCOUNTANT_TAX: Kế toán thuế, ACCOUNTANT_GENERAL: Kế toán viên)',
  })
  @IsEnum(AccountantRoleType)
  accountantRole!: AccountantRoleType;

  @ApiPropertyOptional({ description: 'ID phòng ban kế toán (nếu có)' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
