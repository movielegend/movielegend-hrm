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

@ApiTags('Users')
@ApiBearerAuth()
@Roles('ADMIN')
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
}
