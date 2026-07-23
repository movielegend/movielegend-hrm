import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DateRangeReportQueryDto, EmployeeReportQueryDto, KpiReportQueryDto } from '../reports/dto/report-query.dto';
import { ExportService } from './export.service';
import { AttendanceReportService } from '../reports/attendance-report.service';
import { ReportsService } from '../reports/reports.service';

type ReportName = 'employees' | 'attendance' | 'tasks' | 'assets' | 'warehouse' | 'kpi' | 'payroll';

@ApiTags('Exports')
@ApiBearerAuth()
@Controller('exports')
export class ExportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly exports: ExportService,
    private readonly attendanceReport: AttendanceReportService
  ) {}

  @Get(':report/csv')
  @Permissions('report.export.csv')
  async csv(@Param('report') report: ReportName, @Query() query: DateRangeReportQueryDto, @CurrentUser() actor: AuthenticatedUser, @Res() res: any) {
    const rows = await this.rows(report, query, actor);
    const result = this.exports.exportCsv(`${report}-report-${new Date().toISOString().slice(0, 10)}`, rows);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(Buffer.from(result.content, result.encoding));
  }

  @Get('attendance-detail/excel')
  @Permissions('report.export.excel')
  async attendanceDetailExcel(@Query() query: any, @Res() res: any) {
    const reportData = await this.attendanceReport.getDetailedReport(query);
    const result = await this.exports.exportAttendanceDetailExcel(`Bang-cham-cong-${new Date().toISOString().slice(0, 10)}`, reportData);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(Buffer.from(result.content, result.encoding));
  }

  @Get(':report/excel')
  @Permissions('report.export.excel')
  async excel(@Param('report') report: ReportName, @Query() query: DateRangeReportQueryDto, @CurrentUser() actor: AuthenticatedUser, @Res() res: any) {
    const rows = await this.rows(report, query, actor);
    const result = this.exports.exportExcel(`${report}-report-${new Date().toISOString().slice(0, 10)}`, rows);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(Buffer.from(result.content, result.encoding));
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
