import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { DailyReportsService } from './daily-reports.service';
import {
  CreateDailyReportDto,
  ReviewDailyReportDto,
  ConvertPlanToTasksDto,
  CreateWorkTaskDto,
  CreateWorkTaskUpdateDto,
  ApproveWorkTaskUpdateDto,
  AdminUpdateWorkTaskDto,
  TransferWorkTaskDto,
  QueryWorkTasksDto,
  BulkSaveWorkReportsDto,
} from './dto/daily-report.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('daily-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['daily-reports', 'work-reports'])
export class DailyReportsController {
  constructor(private readonly service: DailyReportsService) {}

  // ─── 1. Daily Summary Report APIs ─────────────────────────────────────────

  @ApiOperation({ summary: 'Tạo hoặc cập nhật Báo cáo cuối ngày (Nhân viên / Leader)' })
  @Post()
  createOrUpdateReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDailyReportDto
  ) {
    return this.service.createOrUpdateReport(user, dto);
  }

  @ApiOperation({ summary: 'Lấy dữ liệu Báo cáo hôm nay (kèm task tự động gợi ý)' })
  @Get(['my-today', 'my'])
  getMyTodayReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') date?: string
  ) {
    return this.service.getMyTodayReport(user, date);
  }

  @ApiOperation({ summary: 'Lịch sử báo cáo cá nhân' })
  @Get('my-history')
  getMyReportHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('month') month?: string
  ) {
    return this.service.getMyReportHistory(user, page ? Number(page) : 1, limit ? Number(limit) : 20, month);
  }

  @ApiOperation({ summary: 'Leader / Quản lý xem danh sách báo cáo phòng ban theo ngày' })
  @Get('department')
  getDepartmentReports(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Query() query: QueryWorkTasksDto & { departmentId?: string; date?: string; includeTasks?: string }
  ) {
    // Nếu request đến từ endpoint legacy work-reports hoặc query các trường task cụ thể
    if (
      req.originalUrl.includes('work-reports') ||
      query.includeTasks === 'true' ||
      query.workStatus ||
      query.approvalStatus
    ) {
      return this.service.getDepartmentTasks(user, query);
    }
    return this.service.getDepartmentReports(user, query.departmentId, query.date);
  }

  @ApiOperation({ summary: 'Leader / Quản lý xem danh sách công việc phòng ban' })
  @Get('department-tasks')
  getDepartmentTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryWorkTasksDto
  ) {
    return this.service.getDepartmentTasks(user, query);
  }

  @ApiOperation({ summary: 'Tổng hợp số liệu phòng ban theo ngày (Leader gom báo cáo)' })
  @Get('department/summary')
  getDepartmentSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
    @Query('date') date?: string
  ) {
    return this.service.getDepartmentSummary(user, departmentId, date);
  }

  @ApiOperation({ summary: 'Leader chuyển kế hoạch ngày mai của nhân viên thành Task' })
  @Post(':id/convert-tasks')
  convertTomorrowPlanToTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ConvertPlanToTasksDto
  ) {
    return this.service.convertTomorrowPlanToTasks(user, id, dto);
  }

  @ApiOperation({ summary: 'Admin xem danh sách báo cáo toàn công ty / toàn miền' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR')
  @Get('admin')
  getAdminReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') date?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string
  ) {
    return this.service.getAdminReports(user, {
      date,
      departmentId,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    });
  }

  @ApiOperation({ summary: 'Admin chấm điểm sao & nhận xét báo cáo (Single-Review Lock)' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Post(':id/review')
  reviewReportByAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewDailyReportDto
  ) {
    return this.service.reviewReportByAdmin(user, id, dto);
  }

  @ApiOperation({ summary: 'Chấm điểm & nhận xét báo cáo ngày theo userId và ngày' })
  @Post('review-by-user-date')
  reviewReportByUserAndDate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { userId: string; reportDate: string; rating: number; review?: string }
  ) {
    return this.service.reviewReportByUserAndDate(user, dto);
  }

  @ApiOperation({ summary: 'Leader / Admin: Yêu cầu làm lại báo cáo (Bắt làm lại)' })
  @Roles('LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Post('request-revision')
  requestReportRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { userId: string; reportDate: string; reason?: string }
  ) {
    return this.service.requestReportRevision(user, dto);
  }

  @ApiOperation({ summary: 'Leader / Admin: Xóa toàn bộ nhiệm vụ của nhân sự theo ngày' })
  @Roles('LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Post('admin/delete-user-day-tasks')
  deleteUserDayTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { userId: string; date: string; reason?: string }
  ) {
    return this.service.deleteUserDayTasks(user, dto);
  }

  // ─── 2. Work Task & Spreadsheet Grid APIs ─────────────────────────────────

  @ApiOperation({ summary: 'Lấy công việc của tôi (hôm nay + chuyển tiếp)' })
  @Get('my-tasks')
  getMyTasks(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryWorkTasksDto) {
    return this.service.getMyTasks(user, query);
  }

  @ApiOperation({ summary: 'Tạo đầu việc mới' })
  @Post('tasks')
  createTask(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkTaskDto) {
    return this.service.createTask(user, dto);
  }

  @ApiOperation({ summary: 'Cập nhật tiến độ hằng ngày của công việc' })
  @Post('tasks/:id/update')
  addWorkTaskUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateWorkTaskUpdateDto
  ) {
    return this.service.addWorkTaskUpdate(user, id, dto);
  }

  @ApiOperation({ summary: 'Chi tiết 1 công việc' })
  @Get('tasks/:id')
  getTaskDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getTaskDetail(user, id);
  }

  @ApiOperation({ summary: 'Lưu hoặc gửi báo cáo hàng loạt (Bảng Excel Grid)' })
  @Post('bulk-save')
  bulkSaveTasks(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkSaveWorkReportsDto) {
    return this.service.bulkSaveTasks(user, dto);
  }

  @ApiOperation({ summary: 'Leader / HR / Kế toán: Tình hình nộp báo cáo' })
  @Roles('LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'HR', 'ACCOUNTANT', 'ACCOUNTANT_LEAD')
  @Get('submission-status')
  getSubmissionStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
    @Query('date') date?: string
  ) {
    return this.service.getSubmissionStatus(user, { departmentId, date });
  }

  @ApiOperation({ summary: 'Admin / Leader: Duyệt hoặc từ chối hoặc yêu cầu bổ sung cập nhật' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'HR', 'ACCOUNTANT_LEAD')
  @Post('tasks/:id/approve-update/:updateId')
  approveTaskUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @Body() dto: ApproveWorkTaskUpdateDto
  ) {
    return this.service.approveTaskUpdate(user, id, updateId, dto);
  }

  @ApiOperation({ summary: 'Leader / HR / Kế toán trưởng: Chuyển người phụ trách công việc' })
  @Roles('LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'HR', 'ACCOUNTANT_LEAD')
  @Post('tasks/:id/transfer')
  transferTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TransferWorkTaskDto
  ) {
    return this.service.transferTask(user, id, dto);
  }

  // ─── 3. Admin Work Task Management APIs ───────────────────────────────────

  @ApiOperation({ summary: 'Admin / HR: Xem toàn bộ công việc' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR')
  @Get('admin/tasks')
  adminGetAllTasks(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryWorkTasksDto) {
    return this.service.adminGetAllTasks(user, query);
  }

  @ApiOperation({ summary: 'Admin: Sửa trực tiếp công việc' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Patch('admin/tasks/:id')
  adminUpdateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateWorkTaskDto
  ) {
    return this.service.adminUpdateTask(user, id, dto);
  }

  @ApiOperation({ summary: 'Admin / Leader: Xóa mềm công việc' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'LEADER')
  @Delete('admin/tasks/:id')
  adminSoftDeleteTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.service.adminSoftDeleteTask(user, id, reason);
  }

  @ApiOperation({ summary: 'Admin / Leader: Xóa mềm hàng loạt công việc' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'LEADER')
  @Post('admin/batch-delete')
  adminBatchDeleteTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Body('taskIds') taskIds: string[],
    @Body('reason') reason?: string
  ) {
    return this.service.adminBatchDeleteTasks(user, taskIds, reason || 'Xóa hàng loạt');
  }

  @ApiOperation({ summary: 'Admin: Duyệt hàng loạt công việc' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Post('admin/batch-approve')
  adminBatchApproveTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Body('taskIds') taskIds: string[],
    @Body('note') note?: string
  ) {
    return this.service.adminBatchApproveTasks(user, taskIds, note);
  }

  @ApiOperation({ summary: 'Admin: Xem lịch sử audit công việc' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Get('admin/history')
  getHistory(@CurrentUser() user: AuthenticatedUser, @Query() query: any) {
    return this.service.getHistory(user, query);
  }

  @ApiOperation({ summary: 'Trigger chuyển tiếp thủ công' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Post('carryover')
  triggerCarryover(@Body('date') date?: string) {
    return this.service.runCarryover(date);
  }

  // ─── 4. Report Detail by ID ───────────────────────────────────────────────

  @ApiOperation({ summary: 'Xem chi tiết một báo cáo theo ID' })
  @Get(':id')
  getReportById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.service.getReportById(user, id);
  }
}
