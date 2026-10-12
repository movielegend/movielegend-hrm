import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export const DEFAULT_PINNED_APPS = ['attendance', 'requests', 'tasks', 'feedbacks'];

export class UpdatePinnedAppsDto {
  @ApiProperty({
    description: 'Danh sách các app key được ghim trên trang chủ (tối thiểu 4 app)',
    example: ['attendance', 'requests', 'tasks', 'feedbacks', 'contracts', 'warehouses'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @ArrayMinSize(4, { message: 'Cần ghim tối thiểu 4 ứng dụng lên trang chủ' })
  appKeys!: string[];
}
