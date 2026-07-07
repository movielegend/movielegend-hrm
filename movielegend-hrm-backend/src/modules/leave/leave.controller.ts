import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  CreateOvertimeRequestDto,
  LeaveRequestQueryDto,
  OvertimeRequestQueryDto,
  RejectRequestDto,
} from './dto/leave.dto';
import { LeaveService } from './leave.service';

@ApiTags('Leave')
@ApiBearerAuth()
@Controller()
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Permissions('leave.type.manage')
  @Post('leave-types')
  createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.leaveService.createLeaveType(dto);
  }

  @AnyPermissions('leave.request', 'leave.balance.read', 'leave.approve')
  @Get('leave/types')
  findLeaveTypes() {
    return this.leaveService.findActiveLeaveTypes();
  }

  @Permissions('leave.request')
  @Post('leave-requests')
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.leaveService.createLeaveRequest(dto, actor);
  }

  @AnyPermissions('leave.balance.read', 'leave.approve')
  @Get('leave-requests')
  findLeaveRequests(@CurrentUser() actor: AuthenticatedUser, @Query() query: LeaveRequestQueryDto) {
    return this.leaveService.findLeaveRequests(actor, query);
  }

  @AnyPermissions('leave.request', 'leave.balance.read')
  @Get('leave-requests/my')
  findMyLeaveRequests(@CurrentUser() actor: AuthenticatedUser, @Query() query: LeaveRequestQueryDto) {
    return this.leaveService.findMyLeaveRequests(actor, query);
  }

  @Permissions('leave.approve')
  @Post('leave-requests/:id/approve')
  approveLeave(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.leaveService.approveLeave(id, actor);
  }

  @Permissions('leave.approve')
  @Post('leave-requests/:id/reject')
  rejectLeave(@Param('id') id: string, @Body() dto: RejectRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.leaveService.rejectLeave(id, dto, actor);
  }

  @Permissions('overtime.request')
  @Post('overtime-requests')
  createOvertime(@Body() dto: CreateOvertimeRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.leaveService.createOvertimeRequest(dto, actor);
  }

  @Permissions('overtime.approve')
  @Post('overtime-requests/:id/approve')
  approveOvertime(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.leaveService.approveOvertime(id, actor);
  }

  @AnyPermissions('overtime.request', 'overtime.approve')
  @Get('overtime/requests/my')
  myOvertime(@CurrentUser() actor: AuthenticatedUser, @Query() query: OvertimeRequestQueryDto) {
    return this.leaveService.findMyOvertimeRequests(actor, query);
  }

  @Permissions('overtime.approve')
  @Get('overtime/requests/pending')
  pendingOvertime(@CurrentUser() actor: AuthenticatedUser, @Query() query: OvertimeRequestQueryDto) {
    return this.leaveService.findPendingOvertimeRequests(actor, query);
  }

  @Permissions('overtime.approve')
  @Post('overtime/requests/:id/reject')
  rejectOvertime(@Param('id') id: string, @Body() dto: RejectRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.leaveService.rejectOvertime(id, dto, actor);
  }
}
