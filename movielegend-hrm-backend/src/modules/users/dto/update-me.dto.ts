import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FaceImageDto } from '../../auth/dto/register.dto';
export class UpdateMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}

export class UpdateFaceDto {
  @ApiProperty({ type: [FaceImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaceImageDto)
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  faceImages!: FaceImageDto[];
}
