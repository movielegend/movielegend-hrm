import { Module } from '@nestjs/common';
import { LevelingController } from './leveling.controller';
import { LevelingService } from './leveling.service';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, RealtimeModule, Phase2PolicyModule, NotificationsModule],
  controllers: [LevelingController],
  providers: [LevelingService],
  exports: [LevelingService],
})
export class LevelingModule {}

