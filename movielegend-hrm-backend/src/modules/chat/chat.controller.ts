import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ) {
    return this.chatService.getMessages(groupId, skip ? Number(skip) : 0, take ? Number(take) : 50);
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
}

