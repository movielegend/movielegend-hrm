"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractStatePolicy = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
let ContractStatePolicy = class ContractStatePolicy {
    transitions = {
        DRAFT: [client_1.ContractStatus.PENDING_INTERNAL_APPROVAL, client_1.ContractStatus.CANCELLED],
        PENDING_INTERNAL_APPROVAL: [client_1.ContractStatus.APPROVED, client_1.ContractStatus.CANCELLED],
        APPROVED: [client_1.ContractStatus.WAITING_EMPLOYEE_SIGNATURE, client_1.ContractStatus.CANCELLED],
        WAITING_EMPLOYEE_SIGNATURE: [client_1.ContractStatus.EMPLOYEE_SIGNED, client_1.ContractStatus.CANCELLED],
        EMPLOYEE_SIGNED: [client_1.ContractStatus.WAITING_COMPANY_SIGNATURE],
        WAITING_COMPANY_SIGNATURE: [client_1.ContractStatus.COMPLETED, client_1.ContractStatus.CANCELLED],
        COMPLETED: [client_1.ContractStatus.ACTIVE],
        ACTIVE: [client_1.ContractStatus.EXPIRED, client_1.ContractStatus.TERMINATED],
        EXPIRED: [],
        TERMINATED: [],
        CANCELLED: [],
    };
    assertTransition(from, to) {
        if (!this.transitions[from].includes(to)) {
            throw (0, error_util_1.badRequest)('CONTRACT_STATE_SKIP_DENIED', `Cannot transition contract from ${from} to ${to}`);
        }
    }
};
exports.ContractStatePolicy = ContractStatePolicy;
exports.ContractStatePolicy = ContractStatePolicy = __decorate([
    (0, common_1.Injectable)()
], ContractStatePolicy);
//# sourceMappingURL=contract-state-policy.service.js.map