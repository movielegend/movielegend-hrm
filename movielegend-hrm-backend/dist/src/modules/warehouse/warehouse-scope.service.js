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
exports.WarehouseScopeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
let WarehouseScopeService = class WarehouseScopeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    canAccessWarehouse(actor, warehouseId) {
        if (actor.roles.includes('ADMIN'))
            return true;
        return actor.scopes.some((scope) => scope.role === 'WAREHOUSE_MANAGER' &&
            scope.scopeType === client_1.RoleScopeType.WAREHOUSE &&
            scope.scopeId === warehouseId);
    }
    assertWarehouseAccess(actor, warehouseId) {
        if (!this.canAccessWarehouse(actor, warehouseId)) {
            throw (0, error_util_1.forbidden)('FORBIDDEN_WAREHOUSE_SCOPE', 'Cannot access this warehouse');
        }
    }
    visibleWarehouseIds(actor) {
        if (actor.roles.includes('ADMIN'))
            return null;
        return actor.scopes
            .filter((scope) => scope.role === 'WAREHOUSE_MANAGER' && scope.scopeType === client_1.RoleScopeType.WAREHOUSE && scope.scopeId)
            .map((scope) => scope.scopeId);
    }
    async assertWarehouseExists(warehouseId) {
        const warehouse = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, deletedAt: null } });
        if (!warehouse)
            throw (0, error_util_1.notFound)('WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    }
};
exports.WarehouseScopeService = WarehouseScopeService;
exports.WarehouseScopeService = WarehouseScopeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehouseScopeService);
//# sourceMappingURL=warehouse-scope.service.js.map