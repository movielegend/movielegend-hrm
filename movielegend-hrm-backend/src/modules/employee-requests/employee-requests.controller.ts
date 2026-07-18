import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateEmployeeRequestDto, EmployeeRequestQueryDto } from './dto/employee-request.dto';
import { EmployeeRequestsService } from './employee-requests.service';

@ApiTags('Employee Requests')
@ApiBearerAuth()
@Controller('employee-requests')
export class EmployeeRequestsController {
  constructor(private readonly employeeRequestsService: EmployeeRequestsService) {}

  @Permissions('employee.request')
  @Post()
  create(@Body() dto: CreateEmployeeRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeeRequestsService.create(dto, actor);
  }

  @Permissions('employee.request.approve')
  @Get()
  findAll(@CurrentUser() actor: AuthenticatedUser, @Query('departmentId') departmentId?: string) {
    return this.employeeRequestsService.findAll(actor, departmentId);
  }

  @Permissions('employee.request')
  @Get('my')
  findMine(@CurrentUser() actor: AuthenticatedUser, @Query() query: EmployeeRequestQueryDto) {
    return this.employeeRequestsService.findMine(actor, query);
  }

  @AnyPermissions('employee.request.approve', 'employee.request')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeeRequestsService.findOne(id, actor);
  }

  @Permissions('employee.request.approve')
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeeRequestsService.approve(id, actor);
  }

  @Permissions('employee.request.approve')
  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeeRequestsService.reject(id, actor);
  }
}
