import { Module } from '@nestjs/common';
import { WorkReportsService } from './work-reports.service';
import { WorkReportsController } from './work-reports.controller';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, Phase2PolicyModule, RealtimeModule],
  controllers: [WorkReportsController],
  providers: [WorkReportsService],
  exports: [WorkReportsService],
})
export class WorkReportsModule {}
