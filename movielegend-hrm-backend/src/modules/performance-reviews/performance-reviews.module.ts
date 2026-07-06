import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PerformanceReviewsController, ReviewCyclesController } from './performance-reviews.controller';
import { PerformanceReviewsService } from './performance-reviews.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule, NotificationsModule, RealtimeModule],
  controllers: [ReviewCyclesController, PerformanceReviewsController],
  providers: [PerformanceReviewsService],
})
export class PerformanceReviewsModule {}
