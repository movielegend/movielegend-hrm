import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../common/decorators/public.decorator';
import { RecruitmentService } from './recruitment.service';
import { JobQueryDto } from './dto/job-query.dto';
import { ApplyJobDto } from './dto/apply-job.dto';

export interface UploadedCvFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Recruitment - Public Careers Portal')
@Public()
@Controller('recruitment')
export class RecruitmentPublicController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Lấy danh sách việc làm công khai (kèm tìm kiếm, lọc, phân trang)' })
  getJobs(@Query() query: JobQueryDto) {
    return this.recruitmentService.getJobs(query);
  }

  @Get('jobs/count')
  @ApiOperation({ summary: 'Thống kê số lượng việc làm theo vùng miền & khối ngành' })
  getJobCount() {
    return this.recruitmentService.getRecruitmentStats();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng quan việc làm' })
  getStats() {
    return this.recruitmentService.getRecruitmentStats();
  }

  @Get('departments')
  @ApiOperation({ summary: 'Lấy danh sách các phòng ban đang mở tuyển dụng' })
  getDepartments() {
    return this.recruitmentService.getDepartments();
  }

  @Get('work-groups')
  @ApiOperation({ summary: 'Lấy danh sách nhóm ngành (tương thích giao diện)' })
  getWorkGroups() {
    return this.recruitmentService.getDepartments();
  }

  @Get('showrooms')
  @ApiOperation({ summary: 'Lấy danh sách các cơ sở / Showroom Movie Legend kèm tọa độ bản đồ' })
  getShowrooms() {
    return this.recruitmentService.getShowrooms();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh mục kỹ năng và nhóm ngành tuyển dụng' })
  getCategories() {
    return this.recruitmentService.getCategories();
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Xem chi tiết tin tuyển dụng theo ID hoặc mã tin' })
  getJobDetail(@Param('id') id: string) {
    return this.recruitmentService.getJobDetail(id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Ứng viên nộp hồ sơ ứng tuyển kèm file CV' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('cv'))
  apply(
    @Body() dto: ApplyJobDto,
    @UploadedFile() file?: UploadedCvFile,
  ) {
    return this.recruitmentService.submitApplication(dto, file);
  }

  @Post('applications')
  @ApiOperation({ summary: 'Nộp hồ sơ ứng tuyển (alias tương thích)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('cv'))
  applyAlias(
    @Body() dto: ApplyJobDto,
    @UploadedFile() file?: UploadedCvFile,
  ) {
    return this.recruitmentService.submitApplication(dto, file);
  }
}
