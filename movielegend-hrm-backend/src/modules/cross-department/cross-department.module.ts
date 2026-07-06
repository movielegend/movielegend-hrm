import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { CrossDepartmentController } from './cross-department.controller';
import { CrossDepartmentService } from './cross-department.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule, NotificationsModule],
  controllers: [CrossDepartmentController],
  providers: [CrossDepartmentService],
})
export class CrossDepartmentModule {}
