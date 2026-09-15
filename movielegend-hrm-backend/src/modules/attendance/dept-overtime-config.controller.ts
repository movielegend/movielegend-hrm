import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DeptOvertimeConfigService } from './dept-overtime-config.service';
import { CreateOrUpdateDeptOvertimeConfigDto } from './dto/dept-overtime-config.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('department-overtime-configs')
export class DeptOvertimeConfigController {
  constructor(private readonly configService: DeptOvertimeConfigService) {}

  @Get()
  @Roles('ADMIN')
  findAll(@CurrentUser() user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    return this.configService.findAll(user);
  }

  @Get('department/:departmentId')
  @Roles('ADMIN')
  findByDepartmentId(@Param('departmentId') departmentId: string, @CurrentUser() user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    return this.configService.findByDepartmentId(departmentId, user);
  }

  @Post()
  @Roles('ADMIN')
  upsert(@Body() dto: CreateOrUpdateDeptOvertimeConfigDto, @CurrentUser() user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    return this.configService.upsert(dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    return this.configService.remove(id, user);
  }
}
