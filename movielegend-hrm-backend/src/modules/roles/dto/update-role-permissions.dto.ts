import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String], description: 'List of permission codes' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  permissionCodes: string[];
}
