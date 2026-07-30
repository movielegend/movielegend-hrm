import { Body, Controller, Delete, Get, Param, Patch, Post, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RegisterDeviceTokenDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications', 'Device Tokens')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('me')
  @Permissions('notification.read')
  findMine(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.notifications.findMine(actor, skip, take);
  }

  @Get('unread-count')
  @Permissions('notification.read')
  unreadCount(@CurrentUser() actor: AuthenticatedUser) {
    return this.notifications.unreadCount(actor);
  }

  @Patch(':id/read')
  @Permissions('notification.read')
  markRead(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.notifications.markRead(id, actor);
  }

  @Patch('read-all')
  @Permissions('notification.read')
  markAllRead(@CurrentUser() actor: AuthenticatedUser) {
    return this.notifications.markAllRead(actor);
  }

  @Post('device-tokens')
  @Permissions('device_token.manage_own')
  registerDevice(@Body() dto: RegisterDeviceTokenDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.notifications.registerDevice(dto, actor);
  }

  @Delete('device-tokens/:id')
  @Permissions('device_token.manage_own')
  revokeDevice(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.notifications.revokeDevice(id, actor);
  }
}
