"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftAssignmentsModule = void 0;
const common_1 = require("@nestjs/common");
const phase2_policy_module_1 = require("../phase2-policy/phase2-policy.module");
const shift_assignments_controller_1 = require("./shift-assignments.controller");
const shift_assignments_service_1 = require("./shift-assignments.service");
let ShiftAssignmentsModule = class ShiftAssignmentsModule {
};
exports.ShiftAssignmentsModule = ShiftAssignmentsModule;
exports.ShiftAssignmentsModule = ShiftAssignmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [phase2_policy_module_1.Phase2PolicyModule],
        controllers: [shift_assignments_controller_1.ShiftAssignmentsController],
        providers: [shift_assignments_service_1.ShiftAssignmentsService],
        exports: [shift_assignments_service_1.ShiftAssignmentsService],
    })
], ShiftAssignmentsModule);
//# sourceMappingURL=shift-assignments.module.js.map