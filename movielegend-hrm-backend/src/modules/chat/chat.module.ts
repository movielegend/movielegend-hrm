import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';

@Module({
  imports: [DatabaseModule, RealtimeModule, NotificationsModule, StorageModule, Phase2PolicyModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {}
