import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AssignShiftDto, BatchAssignShiftDto } from './dto/shift-assignment.dto';
import { ShiftRegistrationDto, ShiftSwapDto } from './dto/shift-request.dto';
import { ShiftAssignmentsService } from './shift-assignments.service';

@ApiTags('Shift Assignments')
@ApiBearerAuth()
@Controller('shift-assignments')
export class ShiftAssignmentsController {
  constructor(private readonly shiftAssignmentsService: ShiftAssignmentsService) {}

  @Permissions('shift.assign')
  @Post()
  assign(@Body() dto: AssignShiftDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.shiftAssignmentsService.assign(dto, actor);
  }

  @Permissions('shift.assign')
  @Post('batch')
  assignBatch(@Body() dto: BatchAssignShiftDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.shiftAssignmentsService.assignBatch(dto, actor);
  }

  @Permissions('shift.read')
  @Get('me')
  mySchedule(@CurrentUser() actor: AuthenticatedUser) {
    return this.shiftAssignmentsService.mySchedule(actor.userId);
  }

  @Permissions('shift.register')
  @Post('registrations')
  register(@Body() dto: ShiftRegistrationDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.shiftAssignmentsService.registerShift(dto, actor);
  }

  @Permissions('shift.swap')
  @Post('swaps')
  swap(@Body() dto: ShiftSwapDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.shiftAssignmentsService.requestSwap(dto, actor);
  }
}
