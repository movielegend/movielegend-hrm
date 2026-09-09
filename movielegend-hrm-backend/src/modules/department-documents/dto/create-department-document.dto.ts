import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDepartmentDocumentDto {
  @ApiPropertyOptional({ description: 'ID phòng ban áp dụng (để trống nếu áp dụng toàn công ty - chỉ Super Admin)' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: 'Tiêu đề / Tên tài liệu' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Mô tả / Ghi chú' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Phân loại tài liệu: QUY_DINH, BIEU_MAU, DAO_TAO, HUONG_DAN, BAN_GIAO, KHAC', default: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Tên tệp gốc' })
  @IsString()
  fileName!: string;

  @ApiProperty({ description: 'Đường dẫn tệp đã upload' })
  @IsString()
  fileUrl!: string;

  @ApiPropertyOptional({ description: 'Khóa lưu trữ storage' })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({ description: 'Loại MIME (vd: application/pdf, image/png)' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Dung lượng tệp (bytes)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({ description: 'ID của file đã tải lên trong bảng UploadedFile' })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}
