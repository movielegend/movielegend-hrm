import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateChatMessageDto {
  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @IsString()
  content!: string;
}
