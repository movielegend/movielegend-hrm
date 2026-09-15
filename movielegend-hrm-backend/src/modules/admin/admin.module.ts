import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';

@Module({
  imports: [NotificationsModule, RealtimeModule, Phase2PolicyModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

