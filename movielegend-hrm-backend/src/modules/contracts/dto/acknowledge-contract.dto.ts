import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class AcknowledgeContractDto {
  @ApiProperty({ description: 'True nếu nhân viên đồng ý, False nếu không đồng ý' })
  @IsBoolean()
  @IsNotEmpty()
  isAgreed!: boolean;

  @ApiPropertyOptional({ description: 'Lý do hoặc ghi chú (bắt buộc nếu không đồng ý)' })
  @ValidateIf((o) => o.isAgreed === false)
  @IsString()
  @IsNotEmpty({ message: 'Phải cung cấp lý do nếu không đồng ý với hợp đồng' })
  @IsOptional()
  note?: string;
}
