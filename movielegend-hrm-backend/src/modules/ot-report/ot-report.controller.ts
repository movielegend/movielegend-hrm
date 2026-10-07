import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  CreateOtReportDto,
  UpdateOtReportDto,
  ApproveOtReportDto,
  RejectOtReportDto,
  OtReportQueryDto,
} from './dto/ot-report.dto';
import { OtReportService } from './ot-report.service';

@ApiTags('OT Reports (Live Department)')
@ApiBearerAuth()
@Controller('ot-reports')
export class OtReportController {
  constructor(private readonly otReportService: OtReportService) {}

  @ApiOperation({ summary: 'Tạo báo cáo OT mới (Dành cho nhân viên phòng Live)' })
  @Post()
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateOtReportDto,
  ) {
    return this.otReportService.create(actor, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách báo cáo OT của tôi' })
  @Get('my')
  findMyReports(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: OtReportQueryDto,
  ) {
    return this.otReportService.findMyReports(actor, query);
  }

  @ApiOperation({ summary: 'Lấy danh sách báo cáo OT chờ duyệt (Leader phòng Live/Admin)' })
  @Get('pending')
  findPendingReports(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: OtReportQueryDto,
  ) {
    return this.otReportService.findPendingReports(actor, query);
  }

  @ApiOperation({ summary: 'Xem chi tiết 1 báo cáo OT' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.otReportService.findOne(id, actor);
  }

  @ApiOperation({ summary: 'Chỉnh sửa báo cáo OT (Chỉ khi đang ở trạng thái Chờ duyệt)' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateOtReportDto,
  ) {
    return this.otReportService.update(id, actor, dto);
  }

  @ApiOperation({ summary: 'Duyệt báo cáo OT (Leader)' })
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ApproveOtReportDto,
  ) {
    return this.otReportService.approve(id, actor, dto);
  }

  @ApiOperation({ summary: 'Không công nhận báo cáo OT (Leader)' })
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: RejectOtReportDto,
  ) {
    return this.otReportService.reject(id, actor, dto);
  }
}
