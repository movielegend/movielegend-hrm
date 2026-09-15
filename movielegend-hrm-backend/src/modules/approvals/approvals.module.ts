import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalPolicyService } from './approval-policy.service';
import { ApprovalsService } from './approvals.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';

@Module({
  imports: [NotificationsModule, Phase2PolicyModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalPolicyService],
  exports: [ApprovalsService, ApprovalPolicyService],
})
export class ApprovalsModule {}
