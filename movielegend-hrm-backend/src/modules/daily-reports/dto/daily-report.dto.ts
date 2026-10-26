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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiPropertyOptional({ description: 'Ghi chú chi tiết' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Chi tiết công việc' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Hạng mục (Vận hành, Kế hoạch...)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Loại việc (THEO_KE_HOACH, PHAT_SINH...)' })
  @IsOptional()
  @IsString()
  taskType?: string;

  @ApiPropertyOptional({ description: 'Mức độ ưu tiên (HIGH, MEDIUM, LOW)' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Hạn chót hoặc ngày dự kiến' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'Khó khăn vướng mắc' })
  @IsOptional()
  @IsString()
  obstacles?: string;

  @ApiPropertyOptional({ description: 'Đề xuất hỗ trợ' })
  @IsOptional()
  @IsString()
  supportRequest?: string;

  @ApiPropertyOptional({ description: 'Tiến độ (%)' })
  @IsOptional()
  @IsNumber()
  progress?: number;

  @ApiPropertyOptional({ description: 'Trạng thái' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Mã công việc (VD: CV001)' })
  @IsOptional()
  @IsString()
  taskCode?: string;

  @ApiPropertyOptional({ description: 'Được chuyển tiếp từ ngày trước' })
  @IsOptional()
  @IsBoolean()
  isCarriedOver?: boolean;
}

export class DailyReportTaskItemDto {
  @ApiPropertyOptional({ description: 'ID của Task trong hệ thống nếu có' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Mã công việc (VD: CV001)' })
  @IsOptional()
  @IsString()
  taskCode?: string;

  @ApiProperty({ description: 'Tên công việc' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Chi tiết công việc' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Hạng mục (Báo cáo, Kế hoạch, Vận hành...)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Phân loại công việc (THEO_KE_HOACH, PHAT_SINH...)' })
  @IsOptional()
  @IsString()
  taskType?: string;

  @ApiPropertyOptional({ description: 'Mức độ ưu tiên (HIGH, MEDIUM, LOW)' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Tiến độ hoàn thành (%)' })
  @IsOptional()
  @IsNumber()
  progress?: number;

  @ApiPropertyOptional({ description: 'Trạng thái công việc' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Thời hạn hoàn thành' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'Ngày dự kiến hoàn thành' })
  @IsOptional()
  @IsString()
  expectedDate?: string;

  @ApiPropertyOptional({ description: 'Ghi chú hoặc lý do' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Ghi chú chi tiết kết quả' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Khó khăn, vướng mắc' })
  @IsOptional()
  @IsString()
  obstacles?: string;

  @ApiPropertyOptional({ description: 'Đề xuất, cần hỗ trợ' })
  @IsOptional()
  @IsString()
  supportRequest?: string;

  @ApiPropertyOptional({ description: 'Đánh dấu là việc nhập tay ngoài hệ thống' })
  @IsOptional()
  @IsBoolean()
  isManual?: boolean;

  @ApiPropertyOptional({ description: 'Đánh dấu đã chọn để nộp' })
  @IsOptional()
  @IsBoolean()
  isSelected?: boolean;
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

// ─── Work Task DTOs ─────────────────────────────────────────────────────────

export class CreateWorkTaskDto {
  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMakeup?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  makeupForDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  makeupReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proxyForUserId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  initialProgress?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialObstacles?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialSupportRequest?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  selfRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  attachments?: any;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isTestBypass?: boolean;
}

export class UpdateWorkTaskDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  selfRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  attachments?: any;
  
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateWorkTaskUpdateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportDate?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  obstacles?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supportRequest?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  selfRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  attachments?: any;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isProxied?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proxyReason?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isTestBypass?: boolean;
}

export class ApproveWorkTaskUpdateDto {
  @ApiProperty()
  @IsString()
  approvalStatus!: 'APPROVED' | 'NEED_MORE_INFO' | 'REJECTED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalNote?: string;
}

export class AdminUpdateWorkTaskDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class TransferWorkTaskDto {
  @ApiProperty()
  @IsString()
  newUserId!: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class QueryWorkTasksDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approvalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: any;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

export class BulkSaveItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  obstacles?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supportRequest?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  selfRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  attachments?: any;
}

export class BulkSaveWorkReportsDto {
  @ApiProperty({ type: [BulkSaveItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkSaveItemDto)
  items!: BulkSaveItemDto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  date?: string;
}
