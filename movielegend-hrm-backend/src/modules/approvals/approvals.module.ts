import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalPolicyService } from './approval-policy.service';
import { ApprovalsService } from './approvals.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalPolicyService],
  exports: [ApprovalsService, ApprovalPolicyService],
})
export class ApprovalsModule {}
