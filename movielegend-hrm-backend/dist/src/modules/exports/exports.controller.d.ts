import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DateRangeReportQueryDto } from '../reports/dto/report-query.dto';
import { ReportsService } from '../reports/reports.service';
import { ExportService } from './export.service';
type ReportName = 'employees' | 'attendance' | 'tasks' | 'assets' | 'warehouse' | 'kpi' | 'payroll';
export declare class ExportsController {
    private readonly reports;
    private readonly exports;
    constructor(reports: ReportsService, exports: ExportService);
    csv(report: ReportName, query: DateRangeReportQueryDto, actor: AuthenticatedUser): Promise<import("./export.service").ExportResult>;
    excel(report: ReportName, query: DateRangeReportQueryDto, actor: AuthenticatedUser): Promise<import("./export.service").ExportResult>;
    private rows;
}
export {};
