import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkReportsService } from './work-reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { 
  CreateWorkTaskDto, 
  UpdateWorkTaskDto,
  CreateWorkTaskUpdateDto,
  ApproveWorkTaskUpdateDto,
  AdminUpdateWorkTaskDto,
  TransferWorkTaskDto,
  QueryWorkTasksDto,
  BulkSaveWorkReportsDto 
} from './dto/work-report.dto';

@ApiTags('work-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-reports')
export class WorkReportsController {
  constructor(private readonly workReportsService: WorkReportsService) {}

  // ─── Employee APIs ───────────────────────────────────────────────────────

  @Get('my-tasks')
  @ApiOperation({ summary: 'Lấy công việc của tôi (hôm nay + chuyển tiếp)' })
  async getMyTasks(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryWorkTasksDto) {
    return this.workReportsService.getMyTasks(user, query);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Tạo đầu việc mới' })
  async createTask(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkTaskDto) {
    return this.workReportsService.createTask(user, dto);
  }

  @Post('tasks/:id/update')
  @ApiOperation({ summary: 'Cập nhật tiến độ hằng ngày' })
  async addWorkTaskUpdate(
    @CurrentUser() user: AuthenticatedUser, 
    @Param('id') id: string,
    @Body() dto: CreateWorkTaskUpdateDto
  ) {
    return this.workReportsService.addWorkTaskUpdate(user, id, dto);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Chi tiết 1 công việc' })
  async getTaskDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.workReportsService.getTaskDetail(user, id);
  }

  @Post('bulk-save')
  @ApiOperation({ summary: 'Lưu hoặc gửi báo cáo hàng loạt (Bảng Excel)' })
  async bulkSaveTasks(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkSaveWorkReportsDto) {
    return this.workReportsService.bulkSaveTasks(user, dto);
  }

  // ─── Leader APIs ─────────────────────────────────────────────────────────

  @Get('department')
  @Roles('LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Leader: Lấy báo cáo phòng ban' })
  async getDepartmentTasks(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryWorkTasksDto) {
    return this.workReportsService.getDepartmentTasks(user, query);
  }

  @Get('submission-status')
  @Roles('LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Leader: Tình hình nộp báo cáo' })
  async getSubmissionStatus(
    @CurrentUser() user: AuthenticatedUser, 
    @Query('departmentId') departmentId?: string,
    @Query('date') date?: string
  ) {
    return this.workReportsService.getSubmissionStatus(user, { departmentId, date });
  }

  @Post('tasks/:id/approve-update/:updateId')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Admin: Duyệt hoặc yêu cầu bổ sung cập nhật' })
  async approveTaskUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @Body() dto: ApproveWorkTaskUpdateDto
  ) {
    return this.workReportsService.approveTaskUpdate(user, id, updateId, dto);
  }

  @Post('tasks/:id/transfer')
  @Roles('LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Leader: Chuyển người phụ trách' })
  async transferTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TransferWorkTaskDto
  ) {
    return this.workReportsService.transferTask(user, id, dto);
  }

  // ─── Admin APIs ──────────────────────────────────────────────────────────

  @Get('admin/tasks')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Admin: Xem toàn bộ công việc' })
  async adminGetAllTasks(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryWorkTasksDto) {
    return this.workReportsService.adminGetAllTasks(user, query);
  }

  @Patch('admin/tasks/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Admin: Sửa trực tiếp công việc' })
  async adminUpdateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateWorkTaskDto
  ) {
    return this.workReportsService.adminUpdateTask(user, id, dto);
  }

  @Delete('admin/tasks/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Admin: Xóa mềm công việc' })
  async adminSoftDeleteTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.workReportsService.adminSoftDeleteTask(user, id, reason);
  }

  @Get('admin/history')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Admin: Xem lịch sử audit' })
  async getHistory(@CurrentUser() user: AuthenticatedUser, @Query() query: any) {
    return this.workReportsService.getHistory(user, query);
  }

  // ─── Cron / System ───────────────────────────────────────────────────────

  @Post('carryover')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Trigger chuyển tiếp thủ công' })
  async triggerCarryover(@Body('date') date?: string) {
    return this.workReportsService.runCarryover(date);
  }
}
