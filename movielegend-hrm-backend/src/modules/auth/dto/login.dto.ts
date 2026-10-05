import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: ['WEB', 'MOBILE'] })
  @IsOptional()
  @IsString()
  platform?: 'WEB' | 'MOBILE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;
}
