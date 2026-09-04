import { Module } from '@nestjs/common';
import { LevelingController } from './leveling.controller';
import { LevelingService } from './leveling.service';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  controllers: [LevelingController],
  providers: [LevelingService],
  exports: [LevelingService],
})
export class LevelingModule {}
