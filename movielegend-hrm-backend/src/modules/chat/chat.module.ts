import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, RealtimeModule, NotificationsModule, StorageModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {}
