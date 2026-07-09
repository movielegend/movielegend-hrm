import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class AcknowledgeDocumentDto {
  @ApiProperty({ description: 'True nếu người dùng đồng ý, False nếu không đồng ý' })
  @IsBoolean()
  @IsNotEmpty()
  isAgreed!: boolean;

  @ApiPropertyOptional({ description: 'Ghi chú hoặc lý do không đồng ý' })
  @ValidateIf((o) => o.isAgreed === false)
  @IsString()
  @IsNotEmpty({ message: 'Phải nhập lý do nếu không đồng ý' })
  @IsOptional()
  note?: string;
}
