import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { TaskGroupsController } from './task-groups.controller';
import { TaskGroupsService } from './task-groups.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule],
  controllers: [TaskGroupsController],
  providers: [TaskGroupsService],
})
export class TaskGroupsModule {}
