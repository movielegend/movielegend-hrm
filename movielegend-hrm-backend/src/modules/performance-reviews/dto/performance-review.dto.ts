import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewerType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewCycleDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsDateString()
  periodStart!: string;

  @ApiProperty()
  @IsDateString()
  periodEnd!: string;

  @ApiProperty()
  @IsDateString()
  selfReviewStart!: string;

  @ApiProperty()
  @IsDateString()
  selfReviewEnd!: string;

  @ApiProperty()
  @IsDateString()
  leaderReviewStart!: string;

  @ApiProperty()
  @IsDateString()
  leaderReviewEnd!: string;

  @ApiProperty()
  @IsDateString()
  finalReviewStart!: string;

  @ApiProperty()
  @IsDateString()
  finalReviewEnd!: string;
}

export class AssignReviewerDto {
  @ApiProperty()
  @IsUUID()
  employeeUserId!: string;

  @ApiProperty()
  @IsUUID()
  reviewerUserId!: string;

  @ApiProperty({ enum: ReviewerType })
  @IsEnum(ReviewerType)
  reviewerType!: ReviewerType;
}

export class SubmitReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;
}
