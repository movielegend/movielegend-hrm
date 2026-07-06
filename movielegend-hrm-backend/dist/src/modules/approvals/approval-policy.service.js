"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalPolicyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let ApprovalPolicyService = class ApprovalPolicyService {
    canApproveDepartment(user, departmentId) {
        if (user.roles.includes('ADMIN'))
            return true;
        if (!user.permissions.includes('employee.approve'))
            return false;
        return user.scopes.some((scope) => scope.role === 'LEADER' &&
            scope.scopeType === client_1.RoleScopeType.DEPARTMENT &&
            scope.scopeId === departmentId);
    }
    visibleDepartmentIds(user) {
        if (user.roles.includes('ADMIN'))
            return null;
        return user.scopes
            .filter((scope) => scope.role === 'LEADER' && scope.scopeType === client_1.RoleScopeType.DEPARTMENT && scope.scopeId)
            .map((scope) => scope.scopeId);
    }
};
exports.ApprovalPolicyService = ApprovalPolicyService;
exports.ApprovalPolicyService = ApprovalPolicyService = __decorate([
    (0, common_1.Injectable)()
], ApprovalPolicyService);
//# sourceMappingURL=approval-policy.service.js.map