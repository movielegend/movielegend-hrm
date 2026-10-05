import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ApplyJobDto {
  @ApiProperty({ description: 'ID hoặc mã tin tuyển dụng', example: 'uuid-string' })
  @IsNotEmpty()
  @IsString()
  jobId!: string;

  @ApiPropertyOptional({ description: 'Tiêu đề tin tuyển dụng', example: 'Chuyên viên Kỹ thuật & Setup Máy chiếu' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ description: 'Họ và tên ứng viên', example: 'Nguyễn Văn An' })
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @ApiProperty({ description: 'Email ứng viên', example: 'nguyenvanan@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0987654321' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ description: 'Ngày sinh', example: '1998-05-20' })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional({ description: 'Giới tính (Nam, Nữ, Khác)', example: 'Nam' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Tỉnh/thành phố nơi ở hiện tại', example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Trình độ học vấn (Đại học, Cao đẳng...)', example: 'Đại học' })
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiPropertyOptional({ description: 'Trường đào tạo', example: 'Đại học Bách Khoa Hà Nội' })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({ description: 'Chuyên ngành học', example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ description: 'Số năm kinh nghiệm', example: '3 năm' })
  @IsOptional()
  @IsString()
  experienceYears?: string;

  @ApiPropertyOptional({ description: 'Công ty hiện tại / gần nhất' })
  @IsOptional()
  @IsString()
  currentCompany?: string;

  @ApiPropertyOptional({ description: 'Kỹ năng chuyên môn' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ description: 'Ghi chú / Thư ngỏ của ứng viên' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'URL file CV (nếu đã tải lên)' })
  @IsOptional()
  @IsString()
  cvFileUrl?: string;

  @ApiPropertyOptional({ description: 'Tên file CV' })
  @IsOptional()
  @IsString()
  cvFileName?: string;

  @ApiPropertyOptional({ description: 'Dung lượng file CV tính theo bytes' })
  @IsOptional()
  cvFileSize?: number;
}
