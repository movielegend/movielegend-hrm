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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const dashboard_service_1 = require("./dashboard.service");
let DashboardController = class DashboardController {
    adminDashboard;
    leaderDashboard;
    employeeDashboard;
    constructor(adminDashboard, leaderDashboard, employeeDashboard) {
        this.adminDashboard = adminDashboard;
        this.leaderDashboard = leaderDashboard;
        this.employeeDashboard = employeeDashboard;
    }
    admin() {
        return this.adminDashboard.summary();
    }
    leader(actor) {
        return this.leaderDashboard.summary(actor);
    }
    me(actor) {
        return this.employeeDashboard.summary(actor);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('admin'),
    (0, permissions_decorator_1.Permissions)('dashboard.admin.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "admin", null);
__decorate([
    (0, common_1.Get)('leader'),
    (0, permissions_decorator_1.Permissions)('dashboard.department.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "leader", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, permissions_decorator_1.Permissions)('dashboard.own.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "me", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.AdminDashboardService,
        dashboard_service_1.LeaderDashboardService,
        dashboard_service_1.EmployeeDashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map