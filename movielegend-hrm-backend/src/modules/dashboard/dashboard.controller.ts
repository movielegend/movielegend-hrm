import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminDashboardService, EmployeeDashboardService, LeaderDashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly adminDashboard: AdminDashboardService,
    private readonly leaderDashboard: LeaderDashboardService,
    private readonly employeeDashboard: EmployeeDashboardService,
  ) {}

  @Get('admin')
  @Permissions('dashboard.admin.read')
  admin() {
    return this.adminDashboard.summary();
  }

  @Get('admin/activities')
  @Permissions('dashboard.admin.read')
  adminActivities() {
    return this.adminDashboard.activities();
  }

  @Get('leader')
  @Permissions('dashboard.department.read')
  leader(@CurrentUser() actor: AuthenticatedUser) {
    return this.leaderDashboard.summary(actor);
  }

  @Get('leader/activities')
  @Permissions('dashboard.department.read')
  leaderActivities(@CurrentUser() actor: AuthenticatedUser) {
    return this.leaderDashboard.activities(actor);
  }

  @Get('me')
  @Permissions('dashboard.own.read')
  me(@CurrentUser() actor: AuthenticatedUser) {
    return this.employeeDashboard.summary(actor);
  }
}
