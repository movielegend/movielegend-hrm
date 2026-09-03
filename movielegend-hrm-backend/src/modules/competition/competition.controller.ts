import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompetitionService } from './competition.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('competition')
@Controller('competition')
@UseGuards(JwtAuthGuard)
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê thi đua doanh số thật từ Database & TikTok' })
  async getStats() {
    return this.competitionService.getDepartmentCompetitionStats();
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Lấy danh sách duyệt thăng cấp 2 bước của Leader & Admin' })
  async getReviews(@Query('period') period?: string) {
    return this.competitionService.getLeaderReviews(period || '2026-09');
  }

  @Post('leader-review')
  @ApiOperation({ summary: 'Leader nộp kết quả duyệt thăng cấp Vòng 1' })
  async submitLeaderReview(
    @Body() body: { userId: string; departmentId: string; period: string; note: string },
  ) {
    return this.competitionService.submitLeaderReview(
      body.userId,
      body.departmentId,
      body.period,
      body.note,
    );
  }

  @Post('admin-approve/:id')
  @ApiOperation({ summary: 'Admin phê duyệt nâng Level & trao thưởng hiện vật MacBook' })
  async submitAdminApproval(
    @Param('id') id: string,
    @Body() body: { toLevelNumber: number; note: string },
  ) {
    return this.competitionService.submitAdminFinalApproval(id, body.toLevelNumber, body.note);
  }
}
