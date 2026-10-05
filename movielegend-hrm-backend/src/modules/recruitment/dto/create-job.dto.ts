import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ description: 'Chức danh công việc', example: 'Senior Backend Developer' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Tên phòng ban / khối tuyển dụng tự do', example: 'Kỹ thuật & Setup Máy chiếu' })
  @IsNotEmpty()
  @IsString()
  departmentName!: string;

  @ApiPropertyOptional({ description: 'Cấp bậc', example: 'Chuyên viên Kỹ thuật' })
  @IsOptional()
  @IsString()
  rankName?: string;

  @ApiProperty({ description: 'Tỉnh thành phố', example: 'Hà Nội' })
  @IsNotEmpty()
  @IsString()
  province!: string;

  @ApiPropertyOptional({ description: 'Mã khu vực vùng miền', example: 'MIEN_BAC' })
  @IsOptional()
  @IsString()
  regionCode?: string;

  @ApiPropertyOptional({ description: 'Tên khu vực hiển thị', example: 'Hà Nội & Miền Bắc' })
  @IsOptional()
  @IsString()
  regionName?: string;

  @ApiPropertyOptional({ description: 'Chi nhánh / Showroom cụ thể' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ description: 'Yêu cầu kinh nghiệm', example: '1 - 3 năm' })
  @IsOptional()
  @IsString()
  experienceRequired?: string;

  @ApiProperty({ description: 'Hạn chót nộp hồ sơ (ISO date string hoặc DD-MM-YYYY)', example: '2026-11-30' })
  @IsNotEmpty()
  @IsString()
  toDate!: string;

  @ApiPropertyOptional({ description: 'Mức lương', example: '15 - 25 triệu VNĐ' })
  @IsOptional()
  @IsString()
  salary?: string;

  @ApiPropertyOptional({ description: 'Sứ mệnh vị trí' })
  @IsOptional()
  @IsString()
  missionContent?: string;

  @ApiPropertyOptional({ description: 'Chế độ phúc lợi đãi ngộ' })
  @IsOptional()
  @IsString()
  welfare?: string;

  @ApiPropertyOptional({ description: 'Mô tả công việc tiếng Việt' })
  @IsOptional()
  @IsString()
  jobDescriptionVn?: string;

  @ApiPropertyOptional({ description: 'Mô tả công việc tiếng Anh' })
  @IsOptional()
  @IsString()
  jobDescriptionEn?: string;

  @ApiPropertyOptional({ description: 'Tags kỹ năng yêu cầu', example: ['NestJS', 'React', 'Docker'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillTags?: string[];

  @ApiPropertyOptional({ description: 'Cấp độ', example: ['Junior', 'Senior'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  level?: string[];

  @ApiPropertyOptional({ enum: JobStatus, default: JobStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus = JobStatus.PUBLISHED;
}
