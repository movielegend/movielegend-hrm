import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackStatus } from '@prisma/client';
import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdateFeedbackStatusDto {
    @ApiProperty({ enum: FeedbackStatus, description: 'Trạng thái mới (REVIEWED, RESOLVED, REJECTED)' })
    @IsEnum(FeedbackStatus)
    status!: FeedbackStatus;

    @ApiPropertyOptional({ description: 'Lý do (bắt buộc khi REJECTED)' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    reason?: string;
}