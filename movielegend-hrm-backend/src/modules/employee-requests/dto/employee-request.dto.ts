import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeRequestStatus, EmployeeRequestType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateEmployeeRequestDto {
  @ApiProperty({ enum: EmployeeRequestType })
  @IsEnum({ ...EmployeeRequestType, ACCOUNT_DELETION: 'ACCOUNT_DELETION' })
  type!: EmployeeRequestType;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attachmentMetadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}

export class EmployeeRequestQueryDto {
  @ApiPropertyOptional({ enum: EmployeeRequestType })
  @IsOptional()
  @IsEnum(EmployeeRequestType)
  type?: EmployeeRequestType;

  @ApiPropertyOptional({ enum: EmployeeRequestStatus })
  @IsOptional()
  @IsEnum(EmployeeRequestStatus)
  status?: EmployeeRequestStatus;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class ApproveEmployeeRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  disbursementProofUrl?: string;
}

export class RejectEmployeeRequestDto {
  @ApiProperty({ description: 'Lý do từ chối yêu cầu (bắt buộc)' })
  @IsString({ message: 'Lý do từ chối phải là chuỗi ký tự' })
  @MinLength(3, { message: 'Vui lòng nhập lý do từ chối cụ thể (tối thiểu 3 ký tự)' })
  reason!: string;
}

export class ExportTransactionsQueryDto {
  @ApiPropertyOptional({ description: 'Ngày cần xuất giao dịch (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Trạng thái duyệt: ALL, PENDING, APPROVED, REJECTED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Loại đơn: EXPENSE, ADVANCE, ALL' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Phòng ban ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Lọc VAT: ALL, WITH_VAT, NO_VAT' })
  @IsOptional()
  @IsString()
  vatOption?: string;
}

export class ImportPaymentItemDto {
  @ApiPropertyOptional({ description: 'Mã yêu cầu (Request ID hoặc một phần mã)' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ description: 'Số tiền thanh toán thực tế' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Trạng thái chuyển khoản: SUCCESS, FAILED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Mã tham chiếu ngân hàng (FT number, Ref code)' })
  @IsOptional()
  @IsString()
  bankRefCode?: string;

  @ApiPropertyOptional({ description: 'Ghi chú giao dịch' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ImportPaymentBatchDto {
  @ApiPropertyOptional({ type: [ImportPaymentItemDto] })
  @IsOptional()
  items?: ImportPaymentItemDto[];

  @ApiPropertyOptional({ description: 'Ghi chú đợt thanh toán' })
  @IsOptional()
  @IsString()
  batchNote?: string;
}

