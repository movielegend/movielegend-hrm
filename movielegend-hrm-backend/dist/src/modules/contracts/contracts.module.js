"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const notifications_module_1 = require("../notifications/notifications.module");
const phase2_policy_module_1 = require("../phase2-policy/phase2-policy.module");
const realtime_module_1 = require("../realtime/realtime.module");
const contract_state_policy_service_1 = require("./contract-state-policy.service");
const contracts_controller_1 = require("./contracts.controller");
const contracts_service_1 = require("./contracts.service");
const document_integrity_service_1 = require("./document-integrity.service");
let ContractsModule = class ContractsModule {
};
exports.ContractsModule = ContractsModule;
exports.ContractsModule = ContractsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, phase2_policy_module_1.Phase2PolicyModule, notifications_module_1.NotificationsModule, realtime_module_1.RealtimeModule],
        controllers: [contracts_controller_1.ContractTemplatesController, contracts_controller_1.EmployeeContractsController],
        providers: [contracts_service_1.ContractsService, contract_state_policy_service_1.ContractStatePolicy, document_integrity_service_1.DocumentIntegrityService],
        exports: [contracts_service_1.ContractsService, contract_state_policy_service_1.ContractStatePolicy, document_integrity_service_1.DocumentIntegrityService],
    })
], ContractsModule);
//# sourceMappingURL=contracts.module.js.map