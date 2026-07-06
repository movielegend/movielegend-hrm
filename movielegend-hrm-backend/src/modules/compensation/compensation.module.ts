import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { BonusesController, DeductionsController } from './compensation.controller';
import { CompensationService } from './compensation.service';

@Module({
  imports: [DatabaseModule, NotificationsModule, RealtimeModule],
  controllers: [BonusesController, DeductionsController],
  providers: [CompensationService],
})
export class CompensationModule {}
