import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { KpiAssignmentsController, KpiTemplatesController } from './kpi.controller';
import { KpiScoringService } from './kpi-scoring.service';
import { KpiService } from './kpi.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule, NotificationsModule, RealtimeModule],
  controllers: [KpiTemplatesController, KpiAssignmentsController],
  providers: [KpiService, KpiScoringService],
  exports: [KpiService, KpiScoringService],
})
export class KpiModule {}
