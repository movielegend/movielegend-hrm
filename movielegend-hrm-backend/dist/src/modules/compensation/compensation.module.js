"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompensationModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const notifications_module_1 = require("../notifications/notifications.module");
const realtime_module_1 = require("../realtime/realtime.module");
const compensation_controller_1 = require("./compensation.controller");
const compensation_service_1 = require("./compensation.service");
let CompensationModule = class CompensationModule {
};
exports.CompensationModule = CompensationModule;
exports.CompensationModule = CompensationModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, notifications_module_1.NotificationsModule, realtime_module_1.RealtimeModule],
        controllers: [compensation_controller_1.BonusesController, compensation_controller_1.DeductionsController],
        providers: [compensation_service_1.CompensationService],
    })
], CompensationModule);
//# sourceMappingURL=compensation.module.js.map