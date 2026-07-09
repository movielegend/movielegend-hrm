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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const report_query_dto_1 = require("../reports/dto/report-query.dto");
const reports_service_1 = require("../reports/reports.service");
const export_service_1 = require("./export.service");
let ExportsController = class ExportsController {
    reports;
    exports;
    constructor(reports, exports) {
        this.reports = reports;
        this.exports = exports;
    }
    async csv(report, query, actor) {
        const rows = await this.rows(report, query, actor);
        return this.exports.exportCsv(`${report}-report-${new Date().toISOString().slice(0, 10)}`, rows);
    }
    async excel(report, query, actor) {
        const rows = await this.rows(report, query, actor);
        return this.exports.exportExcel(`${report}-report-${new Date().toISOString().slice(0, 10)}`, rows);
    }
    rows(report, query, actor) {
        if (report === 'employees')
            return this.reports.employees(query, actor);
        if (report === 'attendance')
            return this.reports.attendance(query, actor);
        if (report === 'tasks')
            return this.reports.tasks(query, actor);
        if (report === 'assets')
            return this.reports.assets();
        if (report === 'warehouse')
            return this.reports.warehouse();
        if (report === 'kpi')
            return this.reports.kpi(query, actor);
        return this.reports.payroll(query, actor);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Get)(':report/csv'),
    (0, permissions_decorator_1.Permissions)('report.export.csv'),
    __param(0, (0, common_1.Param)('report')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, report_query_dto_1.DateRangeReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "csv", null);
__decorate([
    (0, common_1.Get)(':report/excel'),
    (0, permissions_decorator_1.Permissions)('report.export.excel'),
    __param(0, (0, common_1.Param)('report')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, report_query_dto_1.DateRangeReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "excel", null);
exports.ExportsController = ExportsController = __decorate([
    (0, swagger_1.ApiTags)('Exports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('exports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        export_service_1.ExportService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map