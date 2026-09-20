import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class DailyReportMetricItemDto {
  @ApiProperty({ description: 'Tên chỉ tiêu / công việc' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Kết quả số lượng hoặc số tiền' })
  @IsOptional()
  value?: string | number;

  @ApiPropertyOptional({ description: 'Đơn vị tính (VD: Khách, Lỗi, VND)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DailyReportTaskItemDto {
  @ApiPropertyOptional({ description: 'ID của Task trong hệ thống nếu có' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiProperty({ description: 'Tên công việc' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Tiến độ hoàn thành (%)' })
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ description: 'Trạng thái công việc' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Ngày dự kiến hoàn thành' })
  @IsOptional()
  @IsString()
  expectedDate?: string;

  @ApiPropertyOptional({ description: 'Ghi chú hoặc lý do' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Đánh dấu là việc nhập tay ngoài hệ thống' })
  @IsOptional()
  @IsBoolean()
  isManual?: boolean;
}

export class DailyReportAttachmentItemDto {
  @ApiProperty({ description: 'URL tệp' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ description: 'Tên tệp' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Kích thước tệp (bytes)' })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: 'Loại tệp' })
  @IsOptional()
  @IsString()
  fileType?: string;
}

export class CreateDailyReportDto {
  @ApiPropertyOptional({ description: 'Ngày báo cáo YYYY-MM-DD (mặc định hôm nay)' })
  @IsOptional()
  @IsString()
  reportDate?: string;

  @ApiPropertyOptional({ description: 'Loại vai trò nộp: EMPLOYEE hoặc LEADER' })
  @IsOptional()
  @IsString()
  roleType?: 'EMPLOYEE' | 'LEADER';

  @ApiPropertyOptional({ description: 'Bảng chỉ tiêu định lượng', type: [DailyReportMetricItemDto] })
  @IsOptional()
  @IsArray()
  metrics?: DailyReportMetricItemDto[];

  @ApiPropertyOptional({ description: 'Danh sách công việc đã hoàn thành', type: [DailyReportTaskItemDto] })
  @IsOptional()
  @IsArray()
  completedTasks?: DailyReportTaskItemDto[];

  @ApiPropertyOptional({ description: 'Danh sách công việc đang thực hiện / dở dang', type: [DailyReportTaskItemDto] })
  @IsOptional()
  @IsArray()
  inProgressTasks?: DailyReportTaskItemDto[];

  @ApiPropertyOptional({ description: 'Khó khăn / vướng mắc' })
  @IsOptional()
  @IsString()
  obstacles?: string;

  @ApiPropertyOptional({ description: 'Kế hoạch ngày mai', type: [String] })
  @IsOptional()
  @IsArray()
  tomorrowPlan?: string[];

  @ApiPropertyOptional({ description: 'Tệp đính kèm', type: [DailyReportAttachmentItemDto] })
  @IsOptional()
  @IsArray()
  attachments?: DailyReportAttachmentItemDto[];

  @ApiPropertyOptional({ description: 'Tự đánh giá số sao (1 - 5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  selfRating?: number;

  @ApiPropertyOptional({ description: 'Nhận xét ngắn về bản thân' })
  @IsOptional()
  @IsString()
  selfReview?: string;

  @ApiPropertyOptional({ description: 'Lưu nháp (DRAFT) hay nộp chính thức (SUBMITTED)' })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class ReviewDailyReportDto {
  @ApiProperty({ description: 'Số sao Admin chấm (1 - 5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  adminRating!: number;

  @ApiPropertyOptional({ description: 'Lời phê / nhận xét của Admin' })
  @IsOptional()
  @IsString()
  adminReview?: string;
}

export class ConvertPlanToTasksDto {
  @ApiProperty({ description: 'Danh sách các mục kế hoạch muốn chuyển thành Task', type: [String] })
  @IsArray()
  planItems!: string[];

  @ApiPropertyOptional({ description: 'Hạn hoàn thành (mặc định cuối ngày mai)' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}
