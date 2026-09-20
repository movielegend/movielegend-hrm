import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyReportsService } from './daily-reports.service';
import {
  CreateDailyReportDto,
  ReviewDailyReportDto,
  ConvertPlanToTasksDto,
} from './dto/daily-report.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('daily-reports')
@ApiBearerAuth()
@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly service: DailyReportsService) {}

  @ApiOperation({ summary: 'Tạo hoặc cập nhật Báo cáo cuối ngày (Nhân viên / Leader)' })
  @Post()
  createOrUpdateReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDailyReportDto
  ) {
    return this.service.createOrUpdateReport(user, dto);
  }

  @ApiOperation({ summary: 'Lấy dữ liệu Báo cáo hôm nay (kèm task tự động gợi ý)' })
  @Get('my-today')
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

  @ApiOperation({ summary: 'Trưởng phòng xem danh sách báo cáo phòng ban theo ngày' })
  @Get('department')
  getDepartmentReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
    @Query('date') date?: string
  ) {
    return this.service.getDepartmentReports(user, departmentId, date);
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

  @ApiOperation({ summary: 'Xem chi tiết một báo cáo theo ID' })
  @Get(':id')
  getReportById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.service.getReportById(user, id);
  }
}
