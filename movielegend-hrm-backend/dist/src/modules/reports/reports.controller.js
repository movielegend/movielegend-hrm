"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const report_query_dto_1 = require("./dto/report-query.dto");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reports;
    constructor(reports) {
        this.reports = reports;
    }
    employees(query, actor) {
        return this.reports.employees(query, actor);
    }
    attendance(query, actor) {
        return this.reports.attendance(query, actor);
    }
    tasks(query, actor) {
        return this.reports.tasks(query, actor);
    }
    payroll(query, actor) {
        return this.reports.payroll(query, actor);
    }
    warehouse() {
        return this.reports.warehouse();
    }
    assets() {
        return this.reports.assets();
    }
    kpi(query, actor) {
        return this.reports.kpi(query, actor);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('employees'),
    (0, permissions_decorator_1.Permissions)('report.employee.read'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.EmployeeReportQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "employees", null);
__decorate([
    (0, common_1.Get)('attendance'),
    (0, permissions_decorator_1.Permissions)('report.attendance.read'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.DateRangeReportQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "attendance", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, permissions_decorator_1.Permissions)('report.task.read'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.DateRangeReportQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "tasks", null);
__decorate([
    (0, common_1.Get)('payroll'),
    (0, permissions_decorator_1.Permissions)('report.payroll.summary'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.DateRangeReportQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "payroll", null);
__decorate([
    (0, common_1.Get)('warehouse'),
    (0, permissions_decorator_1.Permissions)('report.warehouse.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "warehouse", null);
__decorate([
    (0, common_1.Get)('assets'),
    (0, permissions_decorator_1.Permissions)('report.asset.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "assets", null);
__decorate([
    (0, common_1.Get)('kpi'),
    (0, permissions_decorator_1.Permissions)('report.kpi.read'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.KpiReportQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "kpi", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map