import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AssignReviewerDto, CreateReviewCycleDto, SubmitReviewDto } from './dto/performance-review.dto';
import { PerformanceReviewsService } from './performance-reviews.service';

@ApiTags('Performance Review Cycles')
@ApiBearerAuth()
@Controller('review-cycles')
export class ReviewCyclesController {
  constructor(private readonly reviews: PerformanceReviewsService) {}

  @Post()
  @Permissions('review_cycle.create')
  create(@Body() dto: CreateReviewCycleDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.createCycle(dto, actor);
  }

  @Get()
  @Permissions('review_cycle.read')
  findAll() {
    return this.reviews.findCycles();
  }

  @Get(':id')
  @Permissions('review_cycle.read')
  findOne(@Param('id') id: string) {
    return this.reviews.findCycle(id);
  }

  @Post(':id/open')
  @Permissions('review_cycle.manage')
  open(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.openCycle(id, actor);
  }

  @Post(':id/advance-stage')
  @Permissions('review_cycle.manage')
  advance(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.advanceStage(id, actor);
  }

  @Post(':id/close')
  @Permissions('review_cycle.manage')
  close(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.closeCycle(id, actor);
  }

  @Post(':id/reviewers')
  @Permissions('review_cycle.manage')
  assignReviewer(@Param('id') id: string, @Body() dto: AssignReviewerDto) {
    return this.reviews.assignReviewer(id, dto);
  }
}

@ApiTags('Performance Reviews')
@ApiBearerAuth()
@Controller('performance-reviews')
export class PerformanceReviewsController {
  constructor(private readonly reviews: PerformanceReviewsService) {}

  @Get('my')
  @Permissions('performance_review.read_own')
  findMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.findMine(actor);
  }

  @Get('department/:departmentId')
  @Permissions('performance_review.read_department')
  findDepartment(@Param('departmentId') departmentId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.findDepartment(departmentId, actor);
  }

  @Get(':id')
  @AnyPermissions('performance_review.read_own', 'performance_review.read_department', 'performance_review.read_all')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.findOne(id, actor);
  }

  @Post(':id/self-submit')
  @Permissions('performance_review.self_submit')
  selfSubmit(@Param('id') id: string, @Body() dto: SubmitReviewDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.selfSubmit(id, dto, actor);
  }

  @Post(':id/leader-submit')
  @Permissions('performance_review.leader_submit')
  leaderSubmit(@Param('id') id: string, @Body() dto: SubmitReviewDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.leaderSubmit(id, dto, actor);
  }

  @Post(':id/finalize')
  @Permissions('performance_review.finalize')
  finalize(@Param('id') id: string, @Body() dto: SubmitReviewDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviews.finalize(id, dto, actor);
  }
}
