import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DateRangeReportQueryDto, EmployeeReportQueryDto, KpiReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('employees')
  @Permissions('report.employee.read')
  employees(@Query() query: EmployeeReportQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reports.employees(query, actor);
  }

  @Get('attendance')
  @Permissions('report.attendance.read')
  attendance(@Query() query: DateRangeReportQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reports.attendance(query, actor);
  }

  @Get('tasks')
  @Permissions('report.task.read')
  tasks(@Query() query: DateRangeReportQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reports.tasks(query, actor);
  }

  @Get('payroll')
  @Permissions('report.payroll.summary')
  payroll(@Query() query: DateRangeReportQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reports.payroll(query, actor);
  }

  @Get('warehouse')
  @Permissions('report.warehouse.read')
  warehouse() {
    return this.reports.warehouse();
  }

  @Get('assets')
  @Permissions('report.asset.read')
  assets() {
    return this.reports.assets();
  }

  @Get('kpi')
  @Permissions('report.kpi.read')
  kpi(@Query() query: KpiReportQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.reports.kpi(query, actor);
  }
}
