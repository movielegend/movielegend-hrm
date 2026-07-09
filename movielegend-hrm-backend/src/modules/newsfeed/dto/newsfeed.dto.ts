import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNewsfeedPostDto {
  @ApiProperty({ description: 'Nội dung bài viết' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Tiêu đề bài viết' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'ID phòng ban (nếu đăng cho riêng phòng ban)' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Danh sách URL hình ảnh' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Danh sách URL đính kèm' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Nội dung bình luận' })
  @IsString()
  content!: string;
}
