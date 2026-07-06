"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollPolicyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
let PayrollPolicyService = class PayrollPolicyService {
    assertPeriodTransition(from, to) {
        const allowed = {
            DRAFT: [client_1.PayrollPeriodStatus.CALCULATING, client_1.PayrollPeriodStatus.CANCELLED],
            CALCULATING: [client_1.PayrollPeriodStatus.CALCULATED, client_1.PayrollPeriodStatus.DRAFT],
            CALCULATED: [client_1.PayrollPeriodStatus.CALCULATING, client_1.PayrollPeriodStatus.UNDER_REVIEW, client_1.PayrollPeriodStatus.CANCELLED],
            UNDER_REVIEW: [client_1.PayrollPeriodStatus.APPROVED, client_1.PayrollPeriodStatus.CALCULATED],
            APPROVED: [client_1.PayrollPeriodStatus.LOCKED],
            LOCKED: [],
            CANCELLED: [],
        };
        if (!allowed[from].includes(to)) {
            throw (0, error_util_1.badRequest)('INVALID_PAYROLL_PERIOD_TRANSITION', `Cannot move payroll period from ${from} to ${to}`);
        }
    }
    dailySalary(baseSalary, standardWorkingDays) {
        return standardWorkingDays > 0 ? baseSalary / standardWorkingDays : 0;
    }
    overtimeAmount(hourlyRate, minutes, multiplier) {
        return hourlyRate * (minutes / 60) * multiplier;
    }
};
exports.PayrollPolicyService = PayrollPolicyService;
exports.PayrollPolicyService = PayrollPolicyService = __decorate([
    (0, common_1.Injectable)()
], PayrollPolicyService);
//# sourceMappingURL=payroll-policy.service.js.map