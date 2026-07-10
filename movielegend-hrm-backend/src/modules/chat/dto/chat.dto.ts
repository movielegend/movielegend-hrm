import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateChatMessageDto {
  @ApiPropertyOptional({ description: 'Nội dung tin nhắn' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn file đính kèm' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Loại file đính kèm (IMAGE/DOCUMENT)' })
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiPropertyOptional({ description: 'Tên file' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Danh sách ID user được nhắc tên', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentions?: string[];
}
