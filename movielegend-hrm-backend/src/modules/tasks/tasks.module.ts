import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { TaskAssignmentsController, TaskExtensionsController, TasksController } from './tasks.controller';
import { TaskPolicyService } from './task-policy.service';
import { TasksService } from './tasks.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule, NotificationsModule],
  controllers: [TasksController, TaskAssignmentsController, TaskExtensionsController],
  providers: [TasksService, TaskPolicyService],
  exports: [TasksService, TaskPolicyService],
})
export class TasksModule {}
