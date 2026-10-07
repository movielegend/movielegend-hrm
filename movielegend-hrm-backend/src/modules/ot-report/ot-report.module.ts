import { Module } from '@nestjs/common';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TimeModule } from '../time/time.module';
import { OtReportController } from './ot-report.controller';
import { OtReportService } from './ot-report.service';

@Module({
  imports: [Phase2PolicyModule, NotificationsModule, TimeModule],
  controllers: [OtReportController],
  providers: [OtReportService],
  exports: [OtReportService],
})
export class OtReportModule {}
