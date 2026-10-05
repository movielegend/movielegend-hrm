import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationStatus, JobStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RecruitmentService } from './recruitment.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateShowroomDto } from './dto/create-showroom.dto';

@ApiTags('Recruitment - HR Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR', 'ADMIN')
@Controller('recruitment/admin')
export class RecruitmentAdminController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ==========================================
  // QUẢN LÝ TIN TUYỂN DỤNG
  // ==========================================

  @Get('jobs')
  @ApiOperation({ summary: 'HR xem danh sách tất cả tin tuyển dụng (kèm số lượng hồ sơ)' })
  getJobs(
    @Query('keyword') keyword?: string,
    @Query('status') status?: JobStatus,
    @Query('departmentName') departmentName?: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    return this.recruitmentService.adminGetJobs({
      keyword,
      status,
      departmentName,
      page,
      size,
    });
  }

  @Post('jobs')
  @ApiOperation({ summary: 'HR tạo mới tin tuyển dụng (tự nhập phòng ban)' })
  createJob(@Body() dto: CreateJobDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.recruitmentService.adminCreateJob(dto, user?.userId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'HR xem chi tiết tin tuyển dụng' })
  getJobDetail(@Param('id') id: string) {
    return this.recruitmentService.getJobDetail(id);
  }

  @Get('jobs/:id/export-excel')
  @ApiOperation({ summary: 'HR xuất file Excel danh sách ứng viên của tin tuyển dụng' })
  async exportJobApplicationsExcel(@Param('id') id: string, @Res() res: any) {
    const { buffer, filename } = await this.recruitmentService.exportJobApplicationsToExcel(id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.end(buffer);
  }

  @Patch('jobs/:id')
  @ApiOperation({ summary: 'HR cập nhật tin tuyển dụng hoặc Đóng/Mở tin' })
  updateJob(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.recruitmentService.adminUpdateJob(id, dto);
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'HR xóa tin tuyển dụng' })
  deleteJob(@Param('id') id: string) {
    return this.recruitmentService.adminDeleteJob(id);
  }

  // ==========================================
  // QUẢN LÝ SHOWROOM / CƠ SỞ
  // ==========================================

  @Get('showrooms')
  @ApiOperation({ summary: 'HR xem danh sách tất cả cơ sở Showroom' })
  getShowrooms() {
    return this.recruitmentService.getShowrooms();
  }

  @Post('showrooms')
  @ApiOperation({ summary: 'HR tạo mới cơ sở Showroom kèm tọa độ bản đồ' })
  createShowroom(@Body() dto: CreateShowroomDto) {
    return this.recruitmentService.createShowroom(dto);
  }

  @Delete('showrooms/:id')
  @ApiOperation({ summary: 'HR xoá cơ sở Showroom' })
  deleteShowroom(@Param('id') id: string) {
    return this.recruitmentService.deleteShowroom(id);
  }

  // ==========================================
  // QUẢN LÝ HỒ SƠ ỨNG VIÊN
  // ==========================================

  @Get('applications/export-excel')
  @ApiOperation({ summary: 'HR xuất file Excel danh sách ứng viên toàn bộ hoặc lọc theo tin' })
  async exportAllApplicationsExcel(
    @Query('jobId') jobId: string,
    @Query('status') status: ApplicationStatus,
    @Res() res: any,
  ) {
    const { buffer, filename } = await this.recruitmentService.exportJobApplicationsToExcel(jobId, status);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.end(buffer);
  }

  @Get('applications')
  @ApiOperation({ summary: 'HR xem danh sách hồ sơ ứng viên nộp theo tin / trạng thái' })
  getApplications(
    @Query('jobId') jobId?: string,
    @Query('status') status?: ApplicationStatus,
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    return this.recruitmentService.adminGetApplications({
      jobId,
      status,
      keyword,
      page,
      size,
    });
  }

  @Get('candidate-history')
  @ApiOperation({ summary: 'HR xem lịch sử tất cả các lần ứng tuyển của một ứng viên' })
  getCandidateHistory(
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    return this.recruitmentService.getCandidateApplicationHistory(email, phone);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'HR xem chi tiết 1 hồ sơ ứng viên và link tải CV' })
  getApplicationDetail(@Param('id') id: string) {
    return this.recruitmentService.adminGetApplicationDetail(id);
  }

  @Patch('applications/:id')
  @ApiOperation({ summary: 'HR cập nhật trạng thái hồ sơ (Duyệt, Hẹn phỏng vấn, Đạt/Từ chối)' })
  updateApplication(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.recruitmentService.adminUpdateApplication(id, dto, user?.userId);
  }

  @Post('applications/:id/remind-interview')
  @ApiOperation({ summary: 'HR gửi nhắc nhở lịch phỏng vấn ứng viên ngay lập tức qua Socket & Thông báo' })
  triggerInterviewReminder(@Param('id') id: string) {
    return this.recruitmentService.manualInterviewReminder(id);
  }
}
