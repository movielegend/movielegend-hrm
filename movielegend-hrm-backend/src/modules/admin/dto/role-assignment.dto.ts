import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleScopeType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  roleId!: string;

  @ApiProperty({ enum: RoleScopeType, default: RoleScopeType.GLOBAL })
  @IsOptional()
  @IsEnum(RoleScopeType)
  scopeType?: RoleScopeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeId?: string;
}
