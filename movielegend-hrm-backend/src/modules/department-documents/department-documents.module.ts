import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { UploadsModule } from '../uploads/uploads.module';
import { DepartmentDocumentsController } from './department-documents.controller';
import { DepartmentDocumentsService } from './department-documents.service';

@Module({
  imports: [Phase2PolicyModule, UploadsModule, NotificationsModule],
  controllers: [DepartmentDocumentsController],
  providers: [DepartmentDocumentsService],
  exports: [DepartmentDocumentsService],
})
export class DepartmentDocumentsModule {}
