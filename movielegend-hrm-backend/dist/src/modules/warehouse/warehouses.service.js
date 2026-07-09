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
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const warehouse_scope_service_1 = require("./warehouse-scope.service");
let WarehousesService = class WarehousesService {
    prisma;
    warehouseScope;
    constructor(prisma, warehouseScope) {
        this.prisma = prisma;
        this.warehouseScope = warehouseScope;
    }
    create(dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const code = dto.code ?? (await this.prisma.nextSequenceCode(tx, 'warehouse_code_seq', 'WH'));
            const warehouse = await tx.warehouse.create({
                data: { ...dto, code },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'WAREHOUSE_CREATED', entityType: 'Warehouse', entityId: warehouse.id },
            });
            return warehouse;
        });
    }
    findAll(actor) {
        const visibleIds = this.warehouseScope.visibleWarehouseIds(actor);
        return this.prisma.warehouse.findMany({
            where: { deletedAt: null, ...(visibleIds ? { id: { in: visibleIds } } : {}) },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, actor) {
        this.warehouseScope.assertWarehouseAccess(actor, id);
        const warehouse = await this.prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
        if (!warehouse)
            throw (0, error_util_1.notFound)('WAREHOUSE_NOT_FOUND', 'Warehouse not found');
        return warehouse;
    }
    async update(id, dto, actor) {
        this.warehouseScope.assertWarehouseAccess(actor, id);
        await this.warehouseScope.assertWarehouseExists(id);
        return this.prisma.warehouse.update({ where: { id }, data: dto });
    }
    async close(id, actor) {
        this.warehouseScope.assertWarehouseAccess(actor, id);
        await this.warehouseScope.assertWarehouseExists(id);
        return this.prisma.warehouse.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
    }
    stocks(id, actor) {
        this.warehouseScope.assertWarehouseAccess(actor, id);
        return this.prisma.warehouseStock.findMany({
            where: { warehouseId: id },
            include: { material: { include: { category: true } } },
            orderBy: { updatedAt: 'desc' },
        });
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        warehouse_scope_service_1.WarehouseScopeService])
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map