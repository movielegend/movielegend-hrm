import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsfeedService } from './newsfeed.service';
import { CreateNewsfeedPostDto, CreateCommentDto } from './dto/newsfeed.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('newsfeed')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('newsfeed')
export class NewsfeedController {
  constructor(private readonly newsfeedService: NewsfeedService) {}

  @ApiOperation({ summary: 'Tạo bài đăng mới' })
  @Permissions('newsfeed.create') // You might want to assign this permission to Admin/Leader
  @Post()
  createPost(@Body() dto: CreateNewsfeedPostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.newsfeedService.createPost(user.userId, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách bài đăng (toàn công ty hoặc theo phòng ban)' })
  @Get()
  getPosts(@Query('departmentId') departmentId?: string) {
    return this.newsfeedService.getPosts(departmentId);
  }

  @ApiOperation({ summary: 'Lấy chi tiết 1 bài đăng (kèm bình luận)' })
  @Get(':id')
  getPostById(@Param('id') id: string) {
    return this.newsfeedService.getPostById(id);
  }

  @ApiOperation({ summary: 'Thích / Bỏ thích bài đăng' })
  @Post(':id/like')
  likePost(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.newsfeedService.likePost(user.userId, id);
  }

  @ApiOperation({ summary: 'Bình luận vào bài đăng' })
  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.newsfeedService.addComment(user.userId, id, dto);
  }
}

