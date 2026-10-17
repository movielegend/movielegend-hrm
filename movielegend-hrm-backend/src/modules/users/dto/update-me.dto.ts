import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsOptional, IsString, IsUrl, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FaceImageDto } from '../../auth/dto/register.dto';
export class UpdateMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.email !== '' && o.email !== null && o.email !== undefined)
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

export class ValidateFacePoseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileId?: string;

  @ApiProperty({ description: 'Tư thế yêu cầu (FRONT, LEFT, RIGHT)' })
  @IsString()
  pose!: string;
}

