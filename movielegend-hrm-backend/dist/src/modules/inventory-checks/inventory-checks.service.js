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
exports.InventoryChecksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
const stock_service_1 = require("../stock/stock.service");
const warehouse_scope_service_1 = require("../warehouse/warehouse-scope.service");
let InventoryChecksService = class InventoryChecksService {
    prisma;
    warehouses;
    stock;
    realtime;
    constructor(prisma, warehouses, stock, realtime) {
        this.prisma = prisma;
        this.warehouses = warehouses;
        this.stock = stock;
        this.realtime = realtime;
    }
    create(dto, actor) {
        this.warehouses.assertWarehouseAccess(actor, dto.warehouseId);
        return this.prisma.$transaction(async (tx) => {
            const checkCode = await this.prisma.nextSequenceCode(tx, 'inventory_check_code_seq', 'INV');
            const stocks = await tx.warehouseStock.findMany({ where: { warehouseId: dto.warehouseId } });
            const assets = await tx.asset.findMany({ where: { warehouseId: dto.warehouseId, deletedAt: null } });
            return tx.inventoryCheck.create({
                data: {
                    warehouseId: dto.warehouseId,
                    checkCode,
                    createdById: actor.userId,
                    note: dto.note,
                    items: {
                        create: [
                            ...stocks.map((stock) => ({
                                materialId: stock.materialId,
                                systemQuantity: stock.quantityOnHand,
                                actualQuantity: stock.quantityOnHand,
                                differenceQuantity: 0,
                            })),
                            ...assets.map((asset) => ({
                                assetId: asset.id,
                                expectedAssetStatus: asset.assetStatus,
                                actualAssetStatus: asset.assetStatus,
                            })),
                        ],
                    },
                },
                include: { items: true },
            });
        });
    }
    findAll(actor) {
        const ids = this.warehouses.visibleWarehouseIds(actor);
        return this.prisma.inventoryCheck.findMany({
            where: ids ? { warehouseId: { in: ids } } : {},
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, actor) {
        const check = await this.prisma.inventoryCheck.findUnique({ where: { id }, include: { items: true } });
        if (!check)
            throw (0, error_util_1.notFound)('INVENTORY_CHECK_NOT_FOUND', 'Inventory check not found');
        this.warehouses.assertWarehouseAccess(actor, check.warehouseId);
        return check;
    }
    async updateItems(id, dto, actor) {
        const check = await this.findOne(id, actor);
        if (check.status !== client_1.InventoryCheckStatus.IN_PROGRESS)
            throw (0, error_util_1.conflict)('INVENTORY_CHECK_NOT_EDITABLE', 'Inventory check is not editable');
        return this.prisma.$transaction(async (tx) => {
            for (const item of dto.items) {
                const current = check.items.find((entry) => entry.id === item.id);
                if (!current)
                    throw (0, error_util_1.badRequest)('INVENTORY_CHECK_ITEM_NOT_FOUND', 'Inventory check item not found');
                const difference = current.materialId && item.actualQuantity !== undefined
                    ? item.actualQuantity - Number(current.systemQuantity ?? 0)
                    : undefined;
                await tx.inventoryCheckItem.update({
                    where: { id: item.id },
                    data: { actualQuantity: item.actualQuantity, actualAssetStatus: item.actualAssetStatus, differenceQuantity: difference, note: item.note },
                });
            }
            return tx.inventoryCheck.findUnique({ where: { id }, include: { items: true } });
        });
    }
    async submit(id, actor) {
        const check = await this.findOne(id, actor);
        if (check.status !== client_1.InventoryCheckStatus.IN_PROGRESS)
            throw (0, error_util_1.conflict)('INVENTORY_CHECK_NOT_SUBMITTABLE', 'Inventory check cannot be submitted');
        return this.prisma.inventoryCheck.update({ where: { id }, data: { status: client_1.InventoryCheckStatus.SUBMITTED } });
    }
    async approve(id, actor) {
        const result = await this.prisma.$transaction(async (tx) => {
            const check = await tx.inventoryCheck.findUnique({ where: { id }, include: { items: true } });
            if (!check)
                throw (0, error_util_1.notFound)('INVENTORY_CHECK_NOT_FOUND', 'Inventory check not found');
            this.warehouses.assertWarehouseAccess(actor, check.warehouseId);
            if (check.status !== client_1.InventoryCheckStatus.SUBMITTED)
                throw (0, error_util_1.conflict)('INVENTORY_CHECK_NOT_SUBMITTED', 'Inventory check must be submitted before approval');
            for (const item of check.items) {
                if (item.materialId && item.differenceQuantity && Number(item.differenceQuantity) !== 0) {
                    const diff = Number(item.differenceQuantity);
                    await this.stock.applyStockChange(tx, {
                        warehouseId: check.warehouseId,
                        materialId: item.materialId,
                        quantity: Math.abs(diff),
                        type: diff > 0 ? client_1.StockTransactionType.ADJUSTMENT_INCREASE : client_1.StockTransactionType.ADJUSTMENT_DECREASE,
                        actorUserId: actor.userId,
                        referenceType: 'InventoryCheck',
                        referenceId: id,
                    });
                }
                if (item.assetId && item.actualAssetStatus && item.actualAssetStatus !== item.expectedAssetStatus) {
                    await tx.asset.update({ where: { id: item.assetId }, data: { assetStatus: item.actualAssetStatus } });
                }
            }
            const updated = await tx.inventoryCheck.update({
                where: { id },
                data: { status: client_1.InventoryCheckStatus.APPROVED, approvedById: actor.userId, completedAt: new Date() },
                include: { items: true },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'INVENTORY_CHECK_APPROVED', entityType: 'InventoryCheck', entityId: id },
            });
            return updated;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        this.realtime.emitToRoom(`warehouse:${result.warehouseId}`, 'inventory:updated', result);
        return result;
    }
};
exports.InventoryChecksService = InventoryChecksService;
exports.InventoryChecksService = InventoryChecksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        warehouse_scope_service_1.WarehouseScopeService,
        stock_service_1.StockService,
        realtime_events_service_1.RealtimeEventsService])
], InventoryChecksService);
//# sourceMappingURL=inventory-checks.service.js.map