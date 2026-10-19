import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PresenceService } from './presence.service';

import { IsArray, IsString } from 'class-validator';

export class BatchPresenceDto {
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];
}

@ApiTags('Realtime Presence')
@ApiBearerAuth()
@Controller('realtime/presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  @Post('batch')
  @ApiOperation({ summary: 'Get presence statuses for a batch of users' })
  async getBatchPresence(@Body() dto: BatchPresenceDto) {
    const userIds = Array.isArray(dto.userIds) ? dto.userIds : [];
    return this.presence.getBatchStatuses(userIds);
  }

  @Get('online-users')
  @ApiOperation({ summary: 'Get all online user IDs' })
  getOnlineUsers() {
    return this.presence.getAllOnlineUserIds();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get presence status for a single user' })
  async getUserPresence(@Param('userId') userId: string) {
    const statuses = await this.presence.getBatchStatuses([userId]);
    return statuses[userId] || { isOnline: false, lastActiveAt: null };
  }
}
