import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class FeedbackQueryDto {
    @ApiPropertyOptional({ enum: FeedbackStatus, description: 'Lọc theo trạng thái' })
    @IsOptional()
    @IsEnum(FeedbackStatus)
    status?: FeedbackStatus;

    @ApiPropertyOptional({ type: Boolean, description: 'Lọc theo ẩn danh hay không' })
    @IsOptional()
    @Transform(({ value }: { value: unknown }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isAnonymous?: boolean;

    @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề hoặc nội dung' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    search?: string;

    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;
}