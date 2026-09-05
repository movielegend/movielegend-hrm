import { Controller, Get, Param, Query, Delete, Patch, Body, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ScopedEmployeeQueryDto } from './dto/scoped-employee-query.dto';
import { AccountStatus } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { AdminService } from '../admin/admin.service';
import { WithdrawVaultPointsDto } from '../admin/dto/grant-vault-points.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly adminService: AdminService,
  ) {}

  @Patch(':id/account-status')
  updateAccountStatus(@Param('id') id: string, @Body('status') status: AccountStatus, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeesService.updateAccountStatus(id, status, actor);
  }

  @Get('vault/my-vault')
  getMyVault(@CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.getMyVault(actor.userId);
  }

  @Post('vault/withdraw')
  withdrawVault(@Body() dto: WithdrawVaultPointsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.withdrawVaultPoints(dto, actor.userId);
  }

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

  @Permissions('user.manage')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeesService.remove(id, actor.userId);
  }
}
