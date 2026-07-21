import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateFeedbackDto {
    @ApiProperty({ example: 'Góp ý về môi trường làm việc', description: 'Tiêu đề góp ý' })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
    @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
    @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
    title!: string;

    @ApiProperty({ example: 'Tôi muốn góp ý về...', description: 'Nội dung góp ý' })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty({ message: 'Nội dung không được để trống' })
    @MinLength(10, { message: 'Nội dung phải có ít nhất 10 ký tự' })
    @MaxLength(5000, { message: 'Nội dung không được vượt quá 5000 ký tự' })
    content!: string;

    @ApiProperty({ example: true, description: 'Gửi ẩn danh hay không' })
    @IsBoolean()
    isAnonymous!: boolean;

    @ApiPropertyOptional({ example: 'https://...', description: 'Đường dẫn ảnh đính kèm (nếu có)' })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'img phải là URL hợp lệ' })
    img?: string;
}