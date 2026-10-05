import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateApplicationDto {
  @ApiPropertyOptional({ enum: ApplicationStatus, description: 'Trạng thái xử lý hồ sơ' })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Ghi chú nội bộ của HR khi phỏng vấn/đánh giá' })
  @IsOptional()
  @IsString()
  hrNotes?: string;

  @ApiPropertyOptional({ description: 'Lịch hẹn phỏng vấn (ISO date string)' })
  @IsOptional()
  @IsString()
  interviewDate?: string;

  @ApiPropertyOptional({ description: 'Lý do từ chối nếu không phù hợp' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Điểm đánh giá CV (0 - 100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  aiCvScore?: number;

  @ApiPropertyOptional({ description: 'Tóm tắt nhận xét ứng viên' })
  @IsOptional()
  @IsString()
  aiSummary?: string;
}
