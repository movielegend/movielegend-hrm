import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RecruitmentPublicController } from './recruitment-public.controller';
import { RecruitmentAdminController } from './recruitment-admin.controller';
import { RecruitmentService } from './recruitment.service';

@Module({
  imports: [StorageModule, RealtimeModule, NotificationsModule],
  controllers: [RecruitmentPublicController, RecruitmentAdminController],
  providers: [RecruitmentService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
