import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DateRangeReportQueryDto, EmployeeReportQueryDto, KpiReportQueryDto } from '../reports/dto/report-query.dto';
import { ReportsService } from '../reports/reports.service';
import { ExportService } from './export.service';

type ReportName = 'employees' | 'attendance' | 'tasks' | 'assets' | 'warehouse' | 'kpi' | 'payroll';

@ApiTags('Exports')
@ApiBearerAuth()
@Controller('exports')
export class ExportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly exports: ExportService,
  ) {}

  @Get(':report/csv')
  @Permissions('report.export.csv')
  async csv(@Param('report') report: ReportName, @Query() query: DateRangeReportQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    const rows = await this.rows(report, query, actor);
    return this.exports.exportCsv(`${report}-report-${new Date().toISOString().slice(0, 10)}`, rows);
  }

  @Get(':report/excel')
  @Permissions('report.export.excel')
  async excel(@Param('report') report: ReportName, @Query() query: DateRangeReportQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    const rows = await this.rows(report, query, actor);
    return this.exports.exportExcel(`${report}-report-${new Date().toISOString().slice(0, 10)}`, rows);
  }

  private rows(report: ReportName, query: DateRangeReportQueryDto, actor: AuthenticatedUser): Promise<Array<Record<string, unknown>>> {
    if (report === 'employees') return this.reports.employees(query as EmployeeReportQueryDto, actor);
    if (report === 'attendance') return this.reports.attendance(query, actor);
    if (report === 'tasks') return this.reports.tasks(query, actor);
    if (report === 'assets') return this.reports.assets();
    if (report === 'warehouse') return this.reports.warehouse();
    if (report === 'kpi') return this.reports.kpi(query as KpiReportQueryDto, actor);
    return this.reports.payroll(query, actor);
  }
}
