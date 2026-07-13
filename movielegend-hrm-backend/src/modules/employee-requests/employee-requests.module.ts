import { Module } from '@nestjs/common';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { TimeModule } from '../time/time.module';
import { EmployeeRequestsController } from './employee-requests.controller';
import { EmployeeRequestsService } from './employee-requests.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [Phase2PolicyModule, TimeModule, NotificationsModule],
  controllers: [EmployeeRequestsController],
  providers: [EmployeeRequestsService],
})
export class EmployeeRequestsModule {}
