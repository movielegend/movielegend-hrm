import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
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
  findAll() {
    return this.configService.findAll();
  }

  @Get('department/:departmentId')
  @Roles('ADMIN')
  findByDepartmentId(@Param('departmentId') departmentId: string) {
    return this.configService.findByDepartmentId(departmentId);
  }

  @Post()
  @Roles('ADMIN')
  upsert(@Body() dto: CreateOrUpdateDeptOvertimeConfigDto) {
    return this.configService.upsert(dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.configService.remove(id);
  }
}
