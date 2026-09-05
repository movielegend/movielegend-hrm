import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminService } from './admin.service';
import { AssignRoleDto } from './dto/role-assignment.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LeaderAssignmentDto } from './dto/leader-assignment.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

import {
  GrantVaultPointsDto,
  BulkGrantVaultPointsDto,
  AdminApproveWithdrawalDto,
  AccountantConfirmWithdrawalDto,
  RejectWithdrawalDto,
  WithdrawalQueryDto,
} from './dto/grant-vault-points.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Roles('ADMIN', 'LEADER', 'ACCOUNTANT')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Permissions('role.assign')
  @Post('roles/assign')
  assignRole(@Body() dto: AssignRoleDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.assignRole(dto, actor);
  }

  @Permissions('role.assign')
  @Delete('roles/assignments/:id')
  revokeRole(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.revokeRole(id, actor);
  }

  @Permissions('role.assign')
  @Post('leader-assignments')
  assignLeader(@Body() dto: LeaderAssignmentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.assignLeader(dto, actor);
  }

  @Permissions('role.assign')
  @Delete('leader-assignments/:id')
  revokeLeader(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.revokeLeader(id, actor);
  }

  @Permissions('user.read')
  @Get('users')
  findUsers(@Query() query: UserQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Permissions('user.read')
  @Get('users/:id')
  findUser(@Param('id') id: string) {
    return this.adminService.findUser(id);
  }

  @Permissions('user.manage')
  @Post('users')
  createUser(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.createUser(dto, actor);
  }

  @Permissions('user.update')
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Permissions('user.manage')
  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.deleteUser(id, actor);
  }

  @Permissions('user.manage')
  @Post('talent-vault/grant')
  grantVaultPoints(@Body() dto: GrantVaultPointsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.grantVaultPoints(dto, actor);
  }

  @Permissions('user.manage')
  @Post('talent-vault/bulk-grant')
  bulkGrantVaultPoints(@Body() dto: BulkGrantVaultPointsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.adminService.bulkGrantVaultPoints(dto, actor);
  }

  @Roles('ADMIN', 'ACCOUNTANT')
  @Get('vault/withdrawals')
  getVaultWithdrawalRequests(@Query() query: WithdrawalQueryDto) {
    return this.adminService.getVaultWithdrawalRequests(query);
  }

  @Roles('ADMIN')
  @Post('vault/withdrawals/:id/admin-approve')
  adminApproveWithdrawal(
    @Param('id') id: string,
    @Body() dto: AdminApproveWithdrawalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.adminService.adminApproveWithdrawal(id, dto, actor);
  }

  @Roles('ADMIN', 'ACCOUNTANT')
  @Post('vault/withdrawals/:id/accountant-confirm')
  accountantConfirmWithdrawal(
    @Param('id') id: string,
    @Body() dto: AccountantConfirmWithdrawalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.adminService.accountantConfirmWithdrawal(id, dto, actor);
  }

  @Roles('ADMIN', 'ACCOUNTANT')
  @Post('vault/withdrawals/:id/reject')
  rejectWithdrawal(
    @Param('id') id: string,
    @Body() dto: RejectWithdrawalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.adminService.rejectWithdrawal(id, dto, actor);
  }
}
