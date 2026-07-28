import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VoiceCallService } from './voice-call.service';
import { VoiceCallController } from './voice-call.controller';
import { VoiceCallGateway } from './voice-call.gateway';

@Module({
  imports: [JwtModule.register({})],
  providers: [VoiceCallService, VoiceCallGateway],
  controllers: [VoiceCallController]
})
export class VoiceCallModule {}
