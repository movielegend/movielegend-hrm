"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const app_config_1 = __importDefault(require("./config/app.config"));
const database_config_1 = __importDefault(require("./config/database.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const notification_config_1 = __importDefault(require("./config/notification.config"));
const storage_config_1 = __importDefault(require("./config/storage.config"));
const env_validation_1 = require("./config/env.validation");
const request_logging_middleware_1 = require("./common/middleware/request-logging.middleware");
const database_module_1 = require("./database/database.module");
const admin_module_1 = require("./modules/admin/admin.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const approvals_module_1 = require("./modules/approvals/approvals.module");
const auth_module_1 = require("./modules/auth/auth.module");
const departments_module_1 = require("./modules/departments/departments.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const assets_module_1 = require("./modules/assets/assets.module");
const cross_department_module_1 = require("./modules/cross-department/cross-department.module");
const compensation_module_1 = require("./modules/compensation/compensation.module");
const contracts_module_1 = require("./modules/contracts/contracts.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const employee_documents_module_1 = require("./modules/employee-documents/employee-documents.module");
const employee_requests_module_1 = require("./modules/employee-requests/employee-requests.module");
const employees_module_1 = require("./modules/employees/employees.module");
const face_module_1 = require("./modules/face/face.module");
const health_module_1 = require("./modules/health/health.module");
const leave_module_1 = require("./modules/leave/leave.module");
const inventory_checks_module_1 = require("./modules/inventory-checks/inventory-checks.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const kpi_module_1 = require("./modules/kpi/kpi.module");
const materials_module_1 = require("./modules/materials/materials.module");
const notification_preferences_module_1 = require("./modules/notification-preferences/notification-preferences.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const performance_reviews_module_1 = require("./modules/performance-reviews/performance-reviews.module");
const phase2_policy_module_1 = require("./modules/phase2-policy/phase2-policy.module");
const permissions_module_1 = require("./modules/permissions/permissions.module");
const positions_module_1 = require("./modules/positions/positions.module");
const roles_module_1 = require("./modules/roles/roles.module");
const reports_module_1 = require("./modules/reports/reports.module");
const shift_assignments_module_1 = require("./modules/shift-assignments/shift-assignments.module");
const shifts_module_1 = require("./modules/shifts/shifts.module");
const salary_module_1 = require("./modules/salary/salary.module");
const stock_module_1 = require("./modules/stock/stock.module");
const storage_module_1 = require("./modules/storage/storage.module");
const system_settings_module_1 = require("./modules/system-settings/system-settings.module");
const task_groups_module_1 = require("./modules/task-groups/task-groups.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const time_module_1 = require("./modules/time/time.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const users_module_1 = require("./modules/users/users.module");
const violations_module_1 = require("./modules/violations/violations.module");
const warehouse_module_1 = require("./modules/warehouse/warehouse.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_logging_middleware_1.RequestLoggingMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, database_config_1.default, jwt_config_1.default, storage_config_1.default, notification_config_1.default],
                validate: env_validation_1.validateEnv,
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            database_module_1.DatabaseModule,
            storage_module_1.StorageModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            permissions_module_1.PermissionsModule,
            departments_module_1.DepartmentsModule,
            positions_module_1.PositionsModule,
            employees_module_1.EmployeesModule,
            approvals_module_1.ApprovalsModule,
            face_module_1.FaceModule,
            admin_module_1.AdminModule,
            phase2_policy_module_1.Phase2PolicyModule,
            shifts_module_1.ShiftsModule,
            shift_assignments_module_1.ShiftAssignmentsModule,
            attendance_module_1.AttendanceModule,
            leave_module_1.LeaveModule,
            employee_requests_module_1.EmployeeRequestsModule,
            notifications_module_1.NotificationsModule,
            tasks_module_1.TasksModule,
            task_groups_module_1.TaskGroupsModule,
            cross_department_module_1.CrossDepartmentModule,
            warehouse_module_1.WarehouseModule,
            materials_module_1.MaterialsModule,
            stock_module_1.StockModule,
            assets_module_1.AssetsModule,
            inventory_checks_module_1.InventoryChecksModule,
            time_module_1.TimeModule,
            uploads_module_1.UploadsModule,
            salary_module_1.SalaryModule,
            compensation_module_1.CompensationModule,
            violations_module_1.ViolationsModule,
            payroll_module_1.PayrollModule,
            employee_documents_module_1.EmployeeDocumentsModule,
            contracts_module_1.ContractsModule,
            kpi_module_1.KpiModule,
            performance_reviews_module_1.PerformanceReviewsModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            system_settings_module_1.SystemSettingsModule,
            notification_preferences_module_1.NotificationPreferencesModule,
            jobs_module_1.JobsModule,
            audit_logs_module_1.AuditLogsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map