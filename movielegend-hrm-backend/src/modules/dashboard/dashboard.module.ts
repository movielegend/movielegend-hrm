import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { DashboardController } from './dashboard.controller';
import { AdminDashboardService, DashboardAggregationService, EmployeeDashboardService, LeaderDashboardService } from './dashboard.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule],
  controllers: [DashboardController],
  providers: [DashboardAggregationService, AdminDashboardService, LeaderDashboardService, EmployeeDashboardService],
})
export class DashboardModule {}
