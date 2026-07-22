import { Body, Controller, Get, Param, Patch, Post, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  CreateTaskAttachmentDto,
  CreateTaskCommentDto,
  CreateTaskDto,
  CreateTaskExtensionRequestDto,
  ReviewTaskDto,
  SubmitTaskDto,
  TaskExtensionPendingQueryDto,
  TaskQueryDto,
  TaskReviewQueueQueryDto,
  TaskTimelineQueryDto,
  UpdateProgressDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @AnyPermissions('task.assign_any', 'task.assign_department')
  create(@Body() dto: CreateTaskDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.create(dto, actor);
  }

  @Get()
  @AnyPermissions('task.read_all', 'task.read_department', 'task.read_own')
  findAll(@CurrentUser() actor: AuthenticatedUser, @Query() query: TaskQueryDto) {
    return this.tasks.findAll(actor, query);
  }

  @Get('me')
  @Permissions('task.read_own')
  findMine(@CurrentUser() actor: AuthenticatedUser, @Query() query: TaskQueryDto) {
    return this.tasks.findMine(actor, query);
  }

  @Get(':id/timeline')
  @AnyPermissions('task.read_all', 'task.read_department', 'task.read_own')
  timeline(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser, @Query() query: TaskTimelineQueryDto) {
    return this.tasks.timeline(id, actor, query);
  }

  @Get(':id')
  @AnyPermissions('task.read_all', 'task.read_department', 'task.read_own')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.findOne(id, actor);
  }

  @Patch(':id')
  @AnyPermissions('task.assign_any', 'task.assign_department')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.update(id, dto, actor);
  }

  @Patch(':id/cancel')
  @AnyPermissions('task.assign_any', 'task.assign_department')
  cancel(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.cancel(id, actor);
  }

  @Post(':id/comments')
  @AnyPermissions('task.comment_own', 'task.read_department', 'task.read_all')
  comment(@Param('id') id: string, @Body() dto: CreateTaskCommentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.comment(id, dto, actor);
  }

  @Post(':id/attachments')
  @AnyPermissions('task.comment_own', 'task.read_department', 'task.read_all')
  attach(@Param('id') id: string, @Body() dto: CreateTaskAttachmentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.attach(id, dto, actor);
  }

  @Delete(':id/attachments/:attachmentId')
  @AnyPermissions('task.comment_own', 'task.read_department', 'task.read_all')
  deleteAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.deleteAttachment(id, attachmentId, actor);
  }

  @Post(':id/extensions')
  @Permissions('task.extension_request_own')
  requestExtension(@Param('id') id: string, @Body() dto: CreateTaskExtensionRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.requestExtension(id, dto, actor);
  }
}

@ApiTags('Task Assignments')
@ApiBearerAuth()
@Controller('task-assignments')
export class TaskAssignmentsController {
  constructor(private readonly tasks: TasksService) {}

  @Get('review-queue')
  @AnyPermissions('task.review_all', 'task.review_department')
  reviewQueue(@CurrentUser() actor: AuthenticatedUser, @Query() query: TaskReviewQueueQueryDto) {
    return this.tasks.reviewQueue(actor, query);
  }

  @Patch(':id/accept')
  @Permissions('task.accept_own')
  accept(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.acceptAssignment(id, actor);
  }

  @Patch(':id/start')
  @Permissions('task.update_progress_own')
  start(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.startAssignment(id, actor);
  }

  @Patch(':id/progress')
  @Permissions('task.update_progress_own')
  progress(@Param('id') id: string, @Body() dto: UpdateProgressDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.updateProgress(id, dto, actor);
  }

  @Patch(':id/submit')
  @Permissions('task.submit_own')
  submit(@Param('id') id: string, @Body() dto: SubmitTaskDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.submitAssignment(id, dto, actor);
  }

  @Patch(':id/approve')
  @AnyPermissions('task.review_all', 'task.review_department')
  approve(@Param('id') id: string, @Body() dto: ReviewTaskDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.approveAssignment(id, dto, actor);
  }

  @Patch(':id/reject')
  @AnyPermissions('task.review_all', 'task.review_department')
  reject(@Param('id') id: string, @Body() dto: ReviewTaskDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.rejectAssignment(id, dto, actor);
  }
}

@ApiTags('Task Extensions')
@ApiBearerAuth()
@Controller('task-extensions')
export class TaskExtensionsController {
  constructor(private readonly tasks: TasksService) {}

  @Get('pending')
  @AnyPermissions('task.extension_review_all', 'task.extension_review_department')
  pending(@CurrentUser() actor: AuthenticatedUser, @Query() query: TaskExtensionPendingQueryDto) {
    return this.tasks.pendingExtensions(actor, query);
  }

  @Patch(':id/approve')
  @AnyPermissions('task.extension_review_all', 'task.extension_review_department')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.approveExtension(id, actor);
  }

  @Patch(':id/reject')
  @AnyPermissions('task.extension_review_all', 'task.extension_review_department')
  reject(@Param('id') id: string, @Body() dto: ReviewTaskDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.tasks.rejectExtension(id, actor, dto.note);
  }
}
