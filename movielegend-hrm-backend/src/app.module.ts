import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import notificationConfig from './config/notification.config';
import storageConfig from './config/storage.config';
import { validateEnv } from './config/env.validation';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { BranchesModule } from './modules/branches/branches.module';
import { AssetsModule } from './modules/assets/assets.module';
import { CrossDepartmentModule } from './modules/cross-department/cross-department.module';
import { CompensationModule } from './modules/compensation/compensation.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmployeeDocumentsModule } from './modules/employee-documents/employee-documents.module';
import { EmployeeRequestsModule } from './modules/employee-requests/employee-requests.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { FaceModule } from './modules/face/face.module';
import { HealthModule } from './modules/health/health.module';
import { LeaveModule } from './modules/leave/leave.module';
import { InventoryChecksModule } from './modules/inventory-checks/inventory-checks.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { NotificationPreferencesModule } from './modules/notification-preferences/notification-preferences.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PerformanceReviewsModule } from './modules/performance-reviews/performance-reviews.module';
import { Phase2PolicyModule } from './modules/phase2-policy/phase2-policy.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PositionsModule } from './modules/positions/positions.module';
import { RolesModule } from './modules/roles/roles.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ShiftAssignmentsModule } from './modules/shift-assignments/shift-assignments.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { SalaryModule } from './modules/salary/salary.module';
import { StockModule } from './modules/stock/stock.module';
import { StorageModule } from './modules/storage/storage.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { TaskGroupsModule } from './modules/task-groups/task-groups.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TimeModule } from './modules/time/time.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { ViolationsModule } from './modules/violations/violations.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { NewsfeedModule } from './modules/newsfeed/newsfeed.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, storageConfig, notificationConfig],
      validate: validateEnv,
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rootPath = config.get<string>('storage.localRoot') ?? 'storage';
        return [
          {
            rootPath: require('path').resolve(rootPath),
            serveRoot: '/uploads',
          },
        ];
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DepartmentsModule,
    PositionsModule,
    EmployeesModule,
    ApprovalsModule,
    FaceModule,
    AdminModule,
    Phase2PolicyModule,
    BranchesModule,
    ShiftsModule,
    ShiftAssignmentsModule,
    AttendanceModule,
    LeaveModule,
    EmployeeRequestsModule,
    NotificationsModule,
    TasksModule,
    TaskGroupsModule,
    CrossDepartmentModule,
    WarehouseModule,
    MaterialsModule,
    StockModule,
    AssetsModule,
    InventoryChecksModule,
    TimeModule,
    UploadsModule,
    SalaryModule,
    CompensationModule,
    ViolationsModule,
    PayrollModule,
    EmployeeDocumentsModule,
    ContractsModule,
    KpiModule,
    PerformanceReviewsModule,
    DashboardModule,
    ReportsModule,
    SystemSettingsModule,
    NotificationPreferencesModule,
    JobsModule,
    AuditLogsModule,
    NewsfeedModule,
    ChatModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
