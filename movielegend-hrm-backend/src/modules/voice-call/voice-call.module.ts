import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VoiceCallService } from './voice-call.service';
import { VoiceCallController } from './voice-call.controller';
import { VoiceCallGateway } from './voice-call.gateway';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [JwtModule.register({}), DatabaseModule, NotificationsModule, ChatModule],
  providers: [VoiceCallService, VoiceCallGateway],
  controllers: [VoiceCallController]
})
export class VoiceCallModule {}
