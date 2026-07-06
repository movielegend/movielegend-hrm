import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ScopedEmployeeQueryDto } from './dto/scoped-employee-query.dto';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @AnyPermissions('employee.read', 'task.assign_any', 'task.assign_department')
  @Get('scoped')
  scoped(@CurrentUser() actor: AuthenticatedUser, @Query() query: ScopedEmployeeQueryDto) {
    return this.employeesService.scoped(actor, query);
  }

  @Permissions('employee.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }
}
