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

@ApiTags('leveling')
@Controller('leveling')
@UseGuards(JwtAuthGuard)
export class LevelingController {
  constructor(private readonly levelingService: LevelingService) {}

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
  @ApiOperation({ summary: 'Leader duyệt hoặc yêu cầu làm lại việc con' })
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

  @Get('user-level/:userId')
  @ApiOperation({ summary: 'Lấy Level hiện tại của Nhân sự từ Backend' })
  async getUserLevel(@Param('userId') userId: string) {
    return { userId, levelNumber: this.levelingService.getUserLevel(userId) };
  }

  @Post('user-level/:userId')
  @ApiOperation({ summary: 'Cập nhật hoặc đặt Level trực tiếp cho Nhân sự trên Backend' })
  async updateUserLevel(
    @Param('userId') userId: string,
    @Body() body: { levelNumber: number },
  ) {
    return this.levelingService.updateUserLevel(userId, Number(body.levelNumber) || 1);
  }
}
