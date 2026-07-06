import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AddTaskGroupMemberDto, CreateTaskGroupDto, TaskGroupQueryDto } from './dto/task-group.dto';
import { TaskGroupsService } from './task-groups.service';

@ApiTags('Task Groups')
@ApiBearerAuth()
@Controller('task-groups')
export class TaskGroupsController {
  constructor(private readonly groups: TaskGroupsService) {}

  @Post()
  @AnyPermissions('task.group.manage_all', 'task.group.manage_department')
  create(@Body() dto: CreateTaskGroupDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.groups.create(dto, actor);
  }

  @Get()
  @AnyPermissions('task.group.manage_all', 'task.group.manage_department', 'task.read_department')
  findAll(@CurrentUser() actor: AuthenticatedUser, @Query() query: TaskGroupQueryDto) {
    return this.groups.findAll(actor, query);
  }

  @Get(':id')
  @AnyPermissions('task.group.manage_all', 'task.group.manage_department', 'task.read_department')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.groups.findOne(id, actor);
  }

  @Post(':id/members')
  @AnyPermissions('task.group.manage_all', 'task.group.manage_department')
  addMember(@Param('id') id: string, @Body() dto: AddTaskGroupMemberDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.groups.addMember(id, dto, actor);
  }

  @Delete(':id/members/:userId')
  @AnyPermissions('task.group.manage_all', 'task.group.manage_department')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.groups.removeMember(id, userId, actor);
  }
}
