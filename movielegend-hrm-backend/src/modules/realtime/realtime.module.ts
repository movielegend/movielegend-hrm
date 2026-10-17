import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeEventsService } from './realtime-events.service';
import { RealtimeGateway } from './realtime.gateway';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PresenceController],
  providers: [RealtimeEventsService, RealtimeGateway, PresenceService],
  exports: [RealtimeEventsService, PresenceService],
})
export class RealtimeModule {}
