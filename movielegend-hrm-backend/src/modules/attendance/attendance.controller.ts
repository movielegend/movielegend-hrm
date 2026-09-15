import { Body, Controller, Delete, Get, Ip, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AttendanceService } from './attendance.service';
import {
  AttendanceQueryDto,
  CheckInDto,
  CheckOutDto,
  CreateAttendanceAdjustmentDto,
  CreateAttendanceLocationDto,
  CreateWifiConfigDto,
  ImportTimesheetDto,
  TimesheetQueryDto,
  TrackLocationDto,
  UpdateAttendanceLocationDto,
  UploadTimesheetImageDto,
} from './dto/attendance.dto';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Permissions('attendance.checkin')
  @Post('check-in')
  checkIn(@Body() dto: CheckInDto, @CurrentUser() actor: AuthenticatedUser, @Ip() ip: string) {
    return this.attendanceService.checkIn(dto, actor, ip);
  }

  @Permissions('attendance.checkin')
  @Post('check-out')
  checkOut(@Body() dto: CheckOutDto, @CurrentUser() actor: AuthenticatedUser, @Ip() ip: string) {
    return this.attendanceService.checkOut(dto, actor, ip);
  }

  @Permissions('attendance.adjust')
  @Post('adjustments')
  createAdjustment(@Body() dto: CreateAttendanceAdjustmentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.createAdjustment(dto, actor);
  }

  @Permissions('attendance.adjust')
  @Post('adjustments/:id/approve')
  approveAdjustment(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.approveAdjustment(id, actor);
  }

  @Permissions('attendance.read')
  @Get()
  findAll(@CurrentUser() actor: AuthenticatedUser, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(actor, query);
  }

  @Permissions('attendance.read')
  @Get('dashboard')
  getDashboardStats(@CurrentUser() actor: AuthenticatedUser, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.getDashboardStats(actor, query);
  }

  @AnyPermissions('attendance.checkin', 'attendance.read')
  @Get('current')
  current(@CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.current(actor);
  }

  @AnyPermissions('attendance.checkin', 'attendance.read')
  @Get('my')
  myHistory(@CurrentUser() actor: AuthenticatedUser, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.myHistory(actor, query);
  }

  @AnyPermissions('attendance.checkin', 'attendance.read')
  @Get('timesheet/my')
  getMyMonthlyTimesheet(@CurrentUser() actor: AuthenticatedUser, @Query() query: TimesheetQueryDto) {
    return this.attendanceService.getMyMonthlyTimesheet(actor, query);
  }

  @AnyPermissions('attendance.read', 'attendance.manage', 'attendance.report')
  @Get('timesheet/company')
  getCompanyMonthlyTimesheet(@CurrentUser() actor: AuthenticatedUser, @Query() query: TimesheetQueryDto) {
    return this.attendanceService.getCompanyMonthlyTimesheet(actor, query);
  }

  @AnyPermissions('attendance.manage', 'attendance.adjust')
  @Post('timesheet/import')
  importTimesheet(@Body() dto: ImportTimesheetDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.importMonthlyTimesheet(actor, dto);
  }

  @AnyPermissions('attendance.manage', 'attendance.adjust')
  @Post('timesheet/upload-image')
  uploadTimesheetImage(@Body() dto: UploadTimesheetImageDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.uploadOfficialImage(actor, dto);
  }

  @AnyPermissions('attendance.checkin', 'attendance.read')
  @Get('locations/active')
  activeLocations(@CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.activeLocations(actor);
  }

  @AnyPermissions('attendance.checkin', 'attendance.read')
  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.detail(id, actor);
  }

  @Permissions('attendance.location.manage')
  @Post('locations')
  createLocation(@Body() dto: CreateAttendanceLocationDto) {
    return this.attendanceService.createLocation(dto);
  }

  @Permissions('attendance.location.manage')
  @Patch('locations/:id')
  updateLocation(@Param('id') id: string, @Body() dto: UpdateAttendanceLocationDto) {
    return this.attendanceService.updateLocation(id, dto);
  }

  @Permissions('attendance.location.manage')
  @Delete('locations/:id')
  removeLocation(@Param('id') id: string) {
    return this.attendanceService.removeLocation(id);
  }

  @Permissions('attendance.location.manage')
  @Post('wifi-configs')
  createWifi(@Body() dto: CreateWifiConfigDto) {
    return this.attendanceService.createWifi(dto);
  }

  @Permissions('attendance.checkin')
  @Post('location-tracking')
  track(@Body() dto: TrackLocationDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.attendanceService.trackLocation(dto, actor.userId);
  }
}
