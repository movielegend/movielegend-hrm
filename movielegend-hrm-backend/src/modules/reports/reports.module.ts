import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ExportsController } from '../exports/exports.controller';
import { ExportService } from '../exports/export.service';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { ReportsController } from './reports.controller';
import { ReportsService, ReportScopeService } from './reports.service';
import { AttendanceReportService } from './attendance-report.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule],
  controllers: [ReportsController, ExportsController],
  providers: [ReportsService, ReportScopeService, ExportService, AttendanceReportService],
  exports: [ReportsService, ExportService, AttendanceReportService],
})
export class ReportsModule {}
