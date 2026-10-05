import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class JobQueryDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (chức danh, skill tags, mô tả)' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Tên phòng ban cần lọc' })
  @IsOptional()
  @IsString()
  departmentName?: string;

  @ApiPropertyOptional({ description: 'Tỉnh thành (Hà Nội, TP. Hồ Chí Minh...)' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'Mã vùng miền (MIEN_BAC, MIEN_NAM...)' })
  @IsOptional()
  @IsString()
  regionCode?: string;

  @ApiPropertyOptional({ description: 'Yêu cầu số năm kinh nghiệm' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ description: 'Cấp bậc (Chuyên viên, Trưởng nhóm...)' })
  @IsOptional()
  @IsString()
  rank?: string;

  @ApiPropertyOptional({ description: 'Số trang (bắt đầu từ 0)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({ description: 'Số bản ghi trên trang', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 10;

  @ApiPropertyOptional({ description: 'Sắp xếp theo trường (vd: createdAt:desc)' })
  @IsOptional()
  @IsString()
  sort?: string;
}
