import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceQueryDto {
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

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

export class TimesheetQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class ImportTimesheetItemDto {
  @ApiProperty()
  @IsString()
  userCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  standardWorkingDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualWorkingDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  paidLeaveDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unpaidLeaveDays?: number;

  @ApiPropertyOptional({ description: 'Tổng giờ tăng ca trong tháng' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lateMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  earlyMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ImportTimesheetDto {
  @ApiProperty({ minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ type: [ImportTimesheetItemDto] })
  items!: ImportTimesheetItemDto[];
}

export class UploadTimesheetImageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ description: 'URL ảnh bảng công chốt' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL ảnh bảng công chốt (alias)' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  officialWorkingDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CheckInDto {
  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  workDate!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wifiSsid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wifiBssid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faceImage?: string;

  @ApiPropertyOptional({
    description: 'Preferred Phase 8 contract. Temporary ATTENDANCE UploadedFile id owned by current user.',
  })
  @IsOptional()
  @IsUUID()
  photoFileId?: string;

  @ApiPropertyOptional({
    description: 'Base64 encoded string of the check-in photo. Used to upload image only if check-in succeeds.',
  })
  @IsOptional()
  @IsString()
  photoBase64?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

export class CheckOutDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wifiSsid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wifiBssid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faceImage?: string;

  @ApiPropertyOptional({
    description: 'Temporary ATTENDANCE UploadedFile id owned by current user.',
  })
  @IsOptional()
  @IsUUID()
  photoFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

export class CreateAttendanceAdjustmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  attendanceRecordId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requestedCheckInAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requestedCheckOutAt?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason!: string;
}

export class CreateAttendanceLocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  departmentIds?: string[];

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  radiusMeters?: number;
}

export class UpdateAttendanceLocationDto extends PartialType(CreateAttendanceLocationDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateWifiConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty()
  @IsString()
  ssid!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bssid?: string;
}

export class TrackLocationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracyMeters?: number;
}
