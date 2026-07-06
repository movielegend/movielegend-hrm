import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
import { NotificationPreferencesService } from './notification-preferences.service';

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@Controller('notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly preferences: NotificationPreferencesService) {}

  @Get('me')
  @Permissions('notification_preference.read_own')
  findMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.preferences.findMine(actor);
  }

  @Patch('me')
  @Permissions('notification_preference.update_own')
  updateMine(@Body() dto: UpdateNotificationPreferenceDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.preferences.updateMine(dto, actor);
  }
}
