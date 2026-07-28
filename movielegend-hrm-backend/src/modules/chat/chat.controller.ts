import { Body, Controller, Get, Param, Post, Query, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: 'Lấy danh sách nhóm chat của tôi' })
  @Get('my-groups')
  getMyGroups(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getMyGroups(user.userId);
  }

  @ApiOperation({ summary: 'Lấy tin nhắn trong nhóm chat' })
  @Get('groups/:groupId/messages')
  getMessages(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ) {
    return this.chatService.getMessages(groupId, user.userId, skip ? Number(skip) : 0, take ? Number(take) : 50);
  }

  @ApiOperation({ summary: 'Xóa lịch sử trò chuyện' })
  @Post('groups/:groupId/clear-history')
  clearHistory(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.clearChatHistory(groupId, user.userId);
  }

  // Not strictly needed if using websockets exclusively for sending,
  // but good for testing via REST.
  @ApiOperation({ summary: 'Gửi tin nhắn (REST fallback)' })
  @Post('groups/:groupId/messages')
  sendMessage(
    @Param('groupId') groupId: string,
    @Body() dto: CreateChatMessageDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.sendMessage(user.userId, groupId, dto);
  }

  @ApiOperation({ summary: 'Lấy tất cả nhóm chat (Admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Get('admin/groups')
  getAllGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string
  ) {
    return this.chatService.getAllGroups(user.userId, search);
  }

  @ApiOperation({ summary: 'Tạo chat 1-1' })
  @Post('direct')
  createDirectChat(
    @CurrentUser() user: AuthenticatedUser,
    @Body('targetUserId') targetUserId: string
  ) {
    return this.chatService.createDirectChat(user.userId, targetUserId);
  }

  @ApiOperation({ summary: 'Tạo nhóm chat tuỳ chỉnh' })
  @Post('custom')
  createCustomGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body('name') name: string,
    @Body('memberIds') memberIds: string[]
  ) {
    return this.chatService.createCustomGroup(user.userId, name, memberIds);
  }

  @ApiOperation({ summary: 'Đánh dấu đã đọc tin nhắn trong nhóm' })
  @Post('groups/:groupId/read')
  markGroupAsRead(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.markGroupAsRead(groupId, user.userId);
  }

  @ApiOperation({ summary: 'Xóa nhóm chat' })
  @Delete('groups/:groupId')
  deleteGroup(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const isAdmin = user.roles?.some(r => r.toUpperCase().includes('ADMIN'));
    return this.chatService.deleteGroup(groupId, user.userId, !!isAdmin);
  }
}

