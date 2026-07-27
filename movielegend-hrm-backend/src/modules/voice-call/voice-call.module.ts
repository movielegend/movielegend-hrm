import { Module } from '@nestjs/common';
import { VoiceCallService } from './voice-call.service';
import { VoiceCallController } from './voice-call.controller';
import { VoiceCallGateway } from './voice-call.gateway';

@Module({
  providers: [VoiceCallService, VoiceCallGateway],
  controllers: [VoiceCallController]
})
export class VoiceCallModule {}
