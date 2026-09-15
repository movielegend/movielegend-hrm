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

  @ApiOperation({ summary: 'Lấy danh sách thành viên trong nhóm chat' })
  @Get('groups/:groupId/members')
  getGroupMembers(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.getGroupMembers(groupId, user);
  }

  @ApiOperation({ summary: 'Lấy tin nhắn trong nhóm chat' })
  @Get('groups/:groupId/messages')
  getMessages(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ) {
    return this.chatService.getMessages(groupId, user, skip ? Number(skip) : 0, take ? Number(take) : 50);
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
    return this.chatService.sendMessage(user, groupId, dto);
  }

  @ApiOperation({ summary: 'Lấy tất cả nhóm chat (Admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
  @Get('admin/groups')
  getAllGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string
  ) {
    return this.chatService.getAllGroups(user, search);
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
    return this.chatService.deleteGroup(groupId, user);
  }

  @ApiOperation({ summary: 'Thu hồi tin nhắn' })
  @Delete('groups/:groupId/messages/:messageId')
  deleteMessage(
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.deleteMessage(groupId, messageId, user);
  }

  @ApiOperation({ summary: 'Thả cảm xúc tin nhắn' })
  @Post('groups/:groupId/messages/:messageId/react')
  reactMessage(
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.reactToMessage(groupId, messageId, emoji, user);
  }

  @ApiOperation({ summary: 'Lấy chi tiết danh sách người thả cảm xúc' })
  @Get('groups/:groupId/messages/:messageId/reactions')
  getMessageReactions(
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string
  ) {
    return this.chatService.getMessageReactionDetails(groupId, messageId);
  }

  @ApiOperation({ summary: 'Lấy danh sách người đã xem tin nhắn' })
  @Get('groups/:groupId/messages/:messageId/seen-by')
  getMessageSeenBy(
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string
  ) {
    return this.chatService.getMessageSeenDetails(groupId, messageId);
  }
}

