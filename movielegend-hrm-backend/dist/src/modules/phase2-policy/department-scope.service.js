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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentScopeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
let DepartmentScopeService = class DepartmentScopeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    canAccessDepartment(actor, departmentId) {
        if (actor.roles.includes('ADMIN'))
            return true;
        return actor.scopes.some((scope) => scope.role === 'LEADER' &&
            scope.scopeType === client_1.RoleScopeType.DEPARTMENT &&
            scope.scopeId === departmentId);
    }
    visibleDepartmentIds(actor) {
        if (actor.roles.includes('ADMIN'))
            return null;
        return actor.scopes
            .filter((scope) => scope.role === 'LEADER' && scope.scopeType === client_1.RoleScopeType.DEPARTMENT && scope.scopeId)
            .map((scope) => scope.scopeId);
    }
    assertDepartmentAccess(actor, departmentId) {
        if (!this.canAccessDepartment(actor, departmentId)) {
            throw (0, error_util_1.forbidden)('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban này');
        }
    }
    async getPrimaryDepartmentId(userId) {
        const member = await this.prisma.departmentMember.findFirst({
            where: { userId, leftAt: null, isPrimary: true },
            orderBy: { joinedAt: 'desc' },
        });
        if (!member)
            throw (0, error_util_1.notFound)('DEPARTMENT_MEMBER_NOT_FOUND', 'User chưa thuộc phòng ban active');
        return member.departmentId;
    }
    async assertUserInDepartment(userId, departmentId) {
        const member = await this.prisma.departmentMember.findFirst({
            where: { userId, departmentId, leftAt: null },
        });
        if (!member) {
            throw (0, error_util_1.forbidden)('USER_NOT_IN_DEPARTMENT', 'Nhân viên không thuộc phòng ban này');
        }
    }
};
exports.DepartmentScopeService = DepartmentScopeService;
exports.DepartmentScopeService = DepartmentScopeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentScopeService);
//# sourceMappingURL=department-scope.service.js.map