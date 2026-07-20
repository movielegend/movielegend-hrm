import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ExpoPushService } from './expo-push.service';
import { ShiftReminderService } from './shift-reminder.service';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, ExpoPushService, ShiftReminderService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
