import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LevelingService } from './leveling.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PromotionRequestStatus } from '@prisma/client';

@ApiTags('leveling')
@Controller('leveling')
@UseGuards(JwtAuthGuard)
export class LevelingController {
  constructor(private readonly levelingService: LevelingService) {}

  // =========================================================================
  // 1. DEPARTMENT LEVEL CUSTOM CONFIGS (ADMIN & LEADER)
  // =========================================================================

  @Get('departments/:departmentId/configs')
  @ApiOperation({ summary: 'Lấy danh sách 8 Level kèm tên danh xưng riêng theo phòng ban' })
  async getDepartmentLevelConfigs(@Param('departmentId') departmentId: string) {
    return this.levelingService.getDepartmentLevelConfigs(departmentId);
  }

  @Post('departments/:departmentId/configs')
  @ApiOperation({ summary: 'Admin / Leader lưu cấu hình Tên Level riêng cho phòng ban' })
  async saveDepartmentLevelConfigs(
    @Param('departmentId') departmentId: string,
    @Body()
    body: {
      configs: Array<{ levelNumber: number; customLevelName: string; badgeTitle?: string }>;
    },
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.levelingService.saveDepartmentLevelConfigs(departmentId, body.configs, actor);
  }

  // =========================================================================
  // 2. USER LEVEL PROGRESS & METRICS (%)
  // =========================================================================

  @Get('users/:userId/progress')
  @ApiOperation({ summary: 'Lấy tiến độ % lên cấp chi tiết và các chỉ số đo lường của nhân viên' })
  async getUserLevelProgress(@Param('userId') userId: string) {
    return this.levelingService.getUserLevelProgress(userId);
  }

  @Get('my-progress')
  @ApiOperation({ summary: 'Nhân viên lấy tiến độ % lên cấp của chính mình' })
  async getMyLevelProgress(@CurrentUser() actor: AuthenticatedUser) {
    return this.levelingService.getUserLevelProgress(actor.userId);
  }

  // =========================================================================
  // 3. PROMOTION REQUESTS (EMPLOYEE SUBMIT & LEADER REVIEW)
  // =========================================================================

  @Post('promotion-requests')
  @ApiOperation({ summary: 'Nhân viên nộp hồ sơ đề xuất thăng cấp kèm ghi chú & ảnh bằng chứng' })
  async submitPromotionRequest(
    @Body()
    body: {
      fromLevelNumber: number;
      toLevelNumber: number;
      submissionNote: string;
      evidenceImages?: string[];
      departmentId?: string;
    },
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.levelingService.submitPromotionRequest(actor.userId, body);
  }

  @Get('promotion-requests')
  @ApiOperation({ summary: 'Leader / Admin lấy danh sách đơn xin thăng cấp chờ duyệt của phòng ban' })
  async getDepartmentPromotionRequests(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: PromotionRequestStatus,
    @CurrentUser() actor?: AuthenticatedUser,
  ) {
    return this.levelingService.getDepartmentPromotionRequests(actor!, departmentId, status);
  }

  @Get('promotion-requests/:id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 đơn đề xuất thăng cấp theo ID' })
  async getPromotionRequestById(@Param('id') id: string) {
    return this.levelingService.getPromotionRequestById(id);
  }

  @Post('promotion-requests/:id/review')
  @ApiOperation({ summary: 'Leader thẩm định ảnh bằng chứng và duyệt / yêu cầu bổ sung' })
  async reviewPromotionRequest(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUESTED';
      leaderNote?: string;
    },
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.levelingService.reviewPromotionRequest(id, body, actor);
  }

  // =========================================================================
  // 4. DIRECT LEVEL SETTING (LEADER / ADMIN)
  // =========================================================================

  @Post('users/:userId/set-level')
  @ApiOperation({ summary: 'Leader / Admin đổi cấp bậc Level trực tiếp cho nhân sự' })
  async setDirectUserLevel(
    @Param('userId') userId: string,
    @Body()
    body: {
      levelNumber: number;
      note?: string;
    },
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.levelingService.setDirectUserLevel(
      userId,
      body.levelNumber,
      body.note || 'Leader đổi cấp trực tiếp',
      actor,
    );
  }

  // =========================================================================
  // 5. EXISTING PROJECT / GMV / TASK COMPATIBILITY
  // =========================================================================

  @Get('admin/config')
  @ApiOperation({ summary: 'Lấy cấu hình Level & Dự án theo Phòng ban & Năm cho Admin' })
  async getAdminDepartmentConfig(
    @Query('departmentId') departmentId: string,
    @Query('year') year?: string,
    @Query('departmentName') departmentName?: string,
  ) {
    const y = year ? parseInt(year, 10) : 2026;
    return this.levelingService.getAdminDepartmentConfig(departmentId, y, departmentName);
  }

  @Post('admin/config')
  @ApiOperation({ summary: 'Admin lưu & đồng bộ cấu hình Level, Quà thưởng & Giao Dự Án cho Phòng ban' })
  async saveAdminDepartmentConfig(
    @Body()
    body: {
      departmentId: string;
      departmentName: string;
      year: number;
      levels: any[];
    },
  ) {
    return this.levelingService.saveAdminDepartmentConfig(body);
  }

  @Post('admin/reset-data')
  @ApiOperation({ summary: 'Admin xóa sạch toàn bộ dữ liệu cấu hình Level & Dự án để test lại từ đầu' })
  async clearAllData() {
    return this.levelingService.clearAllData();
  }

  @Get('gmv')
  @ApiOperation({ summary: 'Lấy danh sách cấu hình Doanh số (GMV) toàn bộ các Level 1 -> Level 8' })
  async getGmvConfigs() {
    return this.levelingService.getGmvConfigs();
  }

  @Get('gmv/:levelNumber')
  @ApiOperation({ summary: 'Lấy cấu hình Doanh số (GMV) của một Level cụ thể' })
  async getGmvByLevel(@Param('levelNumber', ParseIntPipe) levelNumber: number) {
    return this.levelingService.getGmvByLevel(levelNumber);
  }

  @Post('gmv/:levelNumber')
  @ApiOperation({ summary: 'Leader / Admin cập nhật Doanh số GMV realtime cho Level' })
  async updateGmv(
    @Param('levelNumber', ParseIntPipe) levelNumber: number,
    @Body()
    body: {
      currentGmv: number;
      promotionCeilingGmv: number;
      retentionFloorGmv: number;
      departmentId?: string;
    },
    @CurrentUser() user?: any,
  ) {
    return this.levelingService.updateGmv(
      levelNumber,
      body.currentGmv,
      body.promotionCeilingGmv,
      body.retentionFloorGmv,
      user?.fullName || user?.name || 'Leader',
      body.departmentId,
    );
  }

  @Get('projects')
  @ApiOperation({ summary: 'Lấy toàn bộ Dự án cấp bậc & các công việc con theo Phòng ban' })
  async getProjects(
    @Query('departmentId') departmentId?: string,
    @Query('departmentName') departmentName?: string,
  ) {
    return this.levelingService.getProjects(departmentId, departmentName);
  }

  @Get('projects/:levelNumber')
  @ApiOperation({ summary: 'Lấy chi tiết dự án & việc con của Level theo Phòng ban' })
  async getProjectByLevel(
    @Param('levelNumber', ParseIntPipe) levelNumber: number,
    @Query('departmentId') departmentId?: string,
    @Query('departmentName') departmentName?: string,
  ) {
    return this.levelingService.getProjectByLevel(levelNumber, departmentId, departmentName);
  }

  @Post('projects/:levelNumber/subtasks/:subTaskId/assign')
  @ApiOperation({ summary: 'Leader phân công việc con hoặc tự nhận việc con' })
  async assignSubTask(
    @Param('levelNumber', ParseIntPipe) levelNumber: number,
    @Param('subTaskId') subTaskId: string,
    @Body()
    body: {
      assignedUserId: string;
      assignedUserName: string;
      departmentId?: string;
      departmentName?: string;
    },
  ) {
    return this.levelingService.assignSubTask(
      levelNumber,
      subTaskId,
      body.assignedUserId,
      body.assignedUserName,
      body.departmentId,
      body.departmentName,
    );
  }

  @Post('projects/:levelNumber/subtasks/:subTaskId/submit')
  @ApiOperation({ summary: 'Nhân sự nộp báo cáo kết quả & minh chứng thực hiện' })
  async submitSubTask(
    @Param('levelNumber', ParseIntPipe) levelNumber: number,
    @Param('subTaskId') subTaskId: string,
    @Body()
    body: {
      submissionNote: string;
      evidenceUrl?: string;
      evidenceImages?: string[];
      departmentId?: string;
      departmentName?: string;
    },
  ) {
    return this.levelingService.submitSubTask(
      levelNumber,
      subTaskId,
      body.submissionNote,
      body.evidenceUrl,
      body.evidenceImages,
      body.departmentId,
      body.departmentName,
    );
  }

  @Post('projects/:levelNumber/subtasks/:subTaskId/review')
  @ApiOperation({ summary: 'Leader duyệt việc con của nhân sự' })
  async reviewSubTask(
    @Param('levelNumber', ParseIntPipe) levelNumber: number,
    @Param('subTaskId') subTaskId: string,
    @Body()
    body: {
      status: 'LEADER_APPROVED' | 'PENDING';
      departmentId?: string;
      departmentName?: string;
    },
    @CurrentUser() user?: any,
  ) {
    return this.levelingService.reviewSubTask(
      levelNumber,
      subTaskId,
      body.status,
      user?.fullName || user?.name || 'Leader',
      body.departmentId,
      body.departmentName,
    );
  }

  @Post('projects/:levelNumber/submit-to-admin')
  @ApiOperation({ summary: 'Leader nộp báo cáo tổng kết dự án lên Admin' })
  async submitProjectToAdmin(
    @Param('levelNumber', ParseIntPipe) levelNumber: number,
    @Body()
    body: {
      leaderReportNote: string;
      leaderReportUrl?: string;
      departmentId?: string;
      departmentName?: string;
    },
  ) {
    return this.levelingService.submitProjectToAdmin(
      levelNumber,
      body.leaderReportNote,
      body.leaderReportUrl,
      body.departmentId,
      body.departmentName,
    );
  }

  @Post('projects/:levelNumber/admin-review')
  @ApiOperation({ summary: 'Admin phê duyệt hoặc yêu cầu bổ sung dự án' })
  async adminReviewProject(
    @Param('levelNumber', ParseIntPipe) levelNumber: number,
    @Body()
    body: {
      status: 'ADMIN_APPROVED' | 'IN_PROGRESS';
      adminFeedback?: string;
      departmentId?: string;
      departmentName?: string;
    },
    @CurrentUser() user?: any,
  ) {
    return this.levelingService.adminReviewProject(
      levelNumber,
      body.status,
      body.adminFeedback,
      body.departmentId,
      body.departmentName,
      user?.fullName || user?.name || 'Ban Giám Đốc',
    );
  }
}
