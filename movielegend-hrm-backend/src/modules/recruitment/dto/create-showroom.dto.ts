import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateShowroomDto {
  @ApiProperty({ description: 'Mã cơ sở (Ví dụ: CS6, CS_CAUGIAY)', example: 'CS6' })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Tên cơ sở / Showroom', example: 'CS6: Cầu Giấy, Hà Nội' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Tỉnh / Thành phố', example: 'Hà Nội' })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiPropertyOptional({ description: 'Vùng / Miền', example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'Quận / Huyện', example: 'Cầu Giấy' })
  @IsNotEmpty()
  @IsString()
  district!: string;

  @ApiProperty({ description: 'Địa chỉ chi tiết (số nhà, tên đường, phường)', example: '106 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội' })
  @IsNotEmpty()
  @IsString()
  address!: string;

  @ApiPropertyOptional({ description: 'Tọa độ kinh độ (Longitude)', example: 105.7881 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Tọa độ vĩ độ (Latitude)', example: 21.0316 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Hotline showroom', example: '03594.66666' })
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiPropertyOptional({ description: 'Giờ mở cửa', example: '08:30 – 21:30 (Cả T7, CN)' })
  @IsOptional()
  @IsString()
  hours?: string;

  @ApiPropertyOptional({ description: 'Điểm nổi bật / Giới thiệu không gian', example: 'Showroom trải nghiệm máy chiếu & rạp phim gia đình cao cấp' })
  @IsOptional()
  @IsString()
  highlight?: string;

  @ApiPropertyOptional({ description: 'Danh sách tính năng nổi bật', type: [String] })
  @IsOptional()
  @IsArray()
  features?: string[];
}
