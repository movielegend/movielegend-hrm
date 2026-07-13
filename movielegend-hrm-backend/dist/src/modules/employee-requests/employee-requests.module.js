"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const phase2_policy_module_1 = require("../phase2-policy/phase2-policy.module");
const time_module_1 = require("../time/time.module");
const employee_requests_controller_1 = require("./employee-requests.controller");
const employee_requests_service_1 = require("./employee-requests.service");
const notifications_module_1 = require("../notifications/notifications.module");
let EmployeeRequestsModule = class EmployeeRequestsModule {
};
exports.EmployeeRequestsModule = EmployeeRequestsModule;
exports.EmployeeRequestsModule = EmployeeRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [phase2_policy_module_1.Phase2PolicyModule, time_module_1.TimeModule, notifications_module_1.NotificationsModule],
        controllers: [employee_requests_controller_1.EmployeeRequestsController],
        providers: [employee_requests_service_1.EmployeeRequestsService],
    })
], EmployeeRequestsModule);
//# sourceMappingURL=employee-requests.module.js.map