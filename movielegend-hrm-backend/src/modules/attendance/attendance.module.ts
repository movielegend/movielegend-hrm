import { Module } from '@nestjs/common';
import { FaceModule } from '../face/face.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { StorageModule } from '../storage/storage.module';
import { TimeModule } from '../time/time.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { DeptOvertimeConfigController } from './dept-overtime-config.controller';
import { DeptOvertimeConfigService } from './dept-overtime-config.service';
import { CompanyHolidayController } from './company-holiday.controller';
import { CompanyHolidayService } from './company-holiday.service';

@Module({
  imports: [Phase2PolicyModule, FaceModule, UploadsModule, TimeModule, StorageModule],
  controllers: [AttendanceController, DeptOvertimeConfigController, CompanyHolidayController],
  providers: [AttendanceService, DeptOvertimeConfigService, CompanyHolidayService],
  exports: [AttendanceService, DeptOvertimeConfigService, CompanyHolidayService],
})
export class AttendanceModule {}
