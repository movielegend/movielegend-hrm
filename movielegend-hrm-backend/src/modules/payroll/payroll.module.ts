import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { PayrollPeriodsController, PayrollsController } from './payroll.controller';
import { PayrollPolicyService } from './payroll-policy.service';
import { PayrollService } from './payroll.service';

@Module({
  imports: [DatabaseModule, NotificationsModule, RealtimeModule, Phase2PolicyModule],
  controllers: [PayrollPeriodsController, PayrollsController],
  providers: [PayrollService, PayrollPolicyService],
})
export class PayrollModule {}
