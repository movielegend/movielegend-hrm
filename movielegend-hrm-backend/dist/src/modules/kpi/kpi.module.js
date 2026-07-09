"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const notifications_module_1 = require("../notifications/notifications.module");
const phase2_policy_module_1 = require("../phase2-policy/phase2-policy.module");
const realtime_module_1 = require("../realtime/realtime.module");
const kpi_controller_1 = require("./kpi.controller");
const kpi_scoring_service_1 = require("./kpi-scoring.service");
const kpi_service_1 = require("./kpi.service");
let KpiModule = class KpiModule {
};
exports.KpiModule = KpiModule;
exports.KpiModule = KpiModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, phase2_policy_module_1.Phase2PolicyModule, notifications_module_1.NotificationsModule, realtime_module_1.RealtimeModule],
        controllers: [kpi_controller_1.KpiTemplatesController, kpi_controller_1.KpiAssignmentsController],
        providers: [kpi_service_1.KpiService, kpi_scoring_service_1.KpiScoringService],
        exports: [kpi_service_1.KpiService, kpi_scoring_service_1.KpiScoringService],
    })
], KpiModule);
//# sourceMappingURL=kpi.module.js.map