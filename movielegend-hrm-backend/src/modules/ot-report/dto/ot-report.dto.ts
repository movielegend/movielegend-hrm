import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { OtReportStatus } from '@prisma/client';

export class CreateOtReportDto {
  @ApiProperty({ description: 'Ngày làm việc OT (YYYY-MM-DD)', example: '2026-10-06' })
  @IsNotEmpty({ message: 'Ngày OT không được để trống' })
  @IsDateString({}, { message: 'Định dạng ngày OT không hợp lệ' })
  otDate!: string;

  @ApiProperty({ description: 'Thời gian bắt đầu OT (ISO)', example: '2026-10-06T21:00:00.000Z' })
  @IsNotEmpty({ message: 'Thời gian bắt đầu OT không được để trống' })
  @IsDateString({}, { message: 'Định dạng thời gian bắt đầu không hợp lệ' })
  startTime!: string;

  @ApiProperty({ description: 'Thời gian kết thúc OT (ISO)', example: '2026-10-06T23:00:00.000Z' })
  @IsNotEmpty({ message: 'Thời gian kết thúc OT không được để trống' })
  @IsDateString({}, { message: 'Định dạng thời gian kết thúc không hợp lệ' })
  endTime!: string;

  @ApiPropertyOptional({ description: '% lương đề xuất (100, 150, 200)', default: 100 })
  @IsOptional()
  @IsInt()
  @IsIn([100, 150, 200], { message: '% lương đề xuất phải là 100, 150 hoặc 200' })
  proposedPercent?: number;

  @ApiPropertyOptional({ description: 'Mô tả công việc OT' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Danh sách ID ảnh đính kèm (ít nhất 1 ảnh)', type: [String] })
  @IsArray({ message: 'Danh sách ảnh phải là mảng' })
  @ArrayMinSize(1, { message: 'Bắt buộc đính kèm ít nhất 1 ảnh xác nhận' })
  @IsUUID('4', { each: true, message: 'ID ảnh không hợp lệ' })
  photoFileIds!: string[];
}

export class UpdateOtReportDto {
  @ApiPropertyOptional({ description: 'Thời gian bắt đầu OT (ISO)' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Thời gian kết thúc OT (ISO)' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: '% lương đề xuất (100, 150, 200)' })
  @IsOptional()
  @IsInt()
  @IsIn([100, 150, 200])
  proposedPercent?: number;

  @ApiPropertyOptional({ description: 'Mô tả công việc OT' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Danh sách ID ảnh đính kèm', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  photoFileIds?: string[];
}

export class ApproveOtReportDto {
  @ApiPropertyOptional({ description: '% lương leader duyệt (100, 150, 200)', default: 100 })
  @IsOptional()
  @IsInt()
  @IsIn([100, 150, 200], { message: '% lương duyệt phải là 100, 150 hoặc 200' })
  approvedPercent?: number;
}

export class RejectOtReportDto {
  @ApiProperty({ description: 'Lý do không công nhận', example: 'Không khớp nội dung ca live' })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do không công nhận' })
  @IsString()
  rejectionReason!: string;
}

export class OtReportQueryDto {
  @ApiPropertyOptional({ description: 'Trạng thái lọc (PENDING, APPROVED, REJECTED, ALL)' })
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'ALL'])
  status?: OtReportStatus | 'ALL';

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Trang', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
