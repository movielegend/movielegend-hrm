import { Injectable } from '@nestjs/common';
import { InventoryCheckStatus, Prisma, StockTransactionType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { StockService } from '../stock/stock.service';
import { WarehouseScopeService } from '../warehouse/warehouse-scope.service';
import { CreateInventoryCheckDto, UpdateInventoryCheckItemsDto } from './dto/inventory-check.dto';

@Injectable()
export class InventoryChecksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly warehouses: WarehouseScopeService,
    private readonly stock: StockService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  create(dto: CreateInventoryCheckDto, actor: AuthenticatedUser) {
    this.warehouses.assertWarehouseAccess(actor, dto.warehouseId);
    return this.prisma.$transaction(async (tx) => {
      const checkCode = await this.prisma.nextSequenceCode(tx, 'inventory_check_code_seq', 'INV');
      const stocks = await tx.warehouseStock.findMany({ where: { warehouseId: dto.warehouseId } });
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
            ],
          },
        },
        include: { items: true },
      });
    });
  }

  findAll(actor: AuthenticatedUser) {
    const ids = this.warehouses.visibleWarehouseIds(actor);
    return this.prisma.inventoryCheck.findMany({
      where: ids ? { warehouseId: { in: ids } } : {},
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const check = await this.prisma.inventoryCheck.findUnique({ where: { id }, include: { items: true } });
    if (!check) throw notFound('INVENTORY_CHECK_NOT_FOUND', 'Inventory check not found');
    this.warehouses.assertWarehouseAccess(actor, check.warehouseId);
    return check;
  }

  async updateItems(id: string, dto: UpdateInventoryCheckItemsDto, actor: AuthenticatedUser) {
    const check = await this.findOne(id, actor);
    if (check.status !== InventoryCheckStatus.IN_PROGRESS) throw conflict('INVENTORY_CHECK_NOT_EDITABLE', 'Inventory check is not editable');
    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const current = check.items.find((entry) => entry.id === item.id);
        if (!current) throw badRequest('INVENTORY_CHECK_ITEM_NOT_FOUND', 'Inventory check item not found');
        const difference =
          current.materialId && item.actualQuantity !== undefined
            ? item.actualQuantity - Number(current.systemQuantity ?? 0)
            : undefined;
        await tx.inventoryCheckItem.update({
          where: { id: item.id },
          data: { actualQuantity: item.actualQuantity, differenceQuantity: difference, note: item.note },
        });
      }
      return tx.inventoryCheck.findUnique({ where: { id }, include: { items: true } });
    });
  }

  async submit(id: string, actor: AuthenticatedUser) {
    const check = await this.findOne(id, actor);
    if (check.status !== InventoryCheckStatus.IN_PROGRESS) throw conflict('INVENTORY_CHECK_NOT_SUBMITTABLE', 'Inventory check cannot be submitted');
    return this.prisma.inventoryCheck.update({ where: { id }, data: { status: InventoryCheckStatus.SUBMITTED } });
  }

  async approve(id: string, actor: AuthenticatedUser) {
    const result = await this.prisma.$transaction(async (tx) => {
      const check = await tx.inventoryCheck.findUnique({ where: { id }, include: { items: true } });
      if (!check) throw notFound('INVENTORY_CHECK_NOT_FOUND', 'Inventory check not found');
      this.warehouses.assertWarehouseAccess(actor, check.warehouseId);
      if (check.status !== InventoryCheckStatus.SUBMITTED) throw conflict('INVENTORY_CHECK_NOT_SUBMITTED', 'Inventory check must be submitted before approval');
      for (const item of check.items) {
        if (item.materialId && item.differenceQuantity && Number(item.differenceQuantity) !== 0) {
          const diff = Number(item.differenceQuantity);
          await this.stock.applyStockChange(tx, {
            warehouseId: check.warehouseId,
            materialId: item.materialId,
            quantity: Math.abs(diff),
            type: diff > 0 ? StockTransactionType.ADJUSTMENT_INCREASE : StockTransactionType.ADJUSTMENT_DECREASE,
            actorUserId: actor.userId,
            referenceType: 'InventoryCheck',
            referenceId: id,
          });
        }
      }
      const updated = await tx.inventoryCheck.update({
        where: { id },
        data: { status: InventoryCheckStatus.APPROVED, approvedById: actor.userId, completedAt: new Date() },
        include: { items: true },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'INVENTORY_CHECK_APPROVED', entityType: 'InventoryCheck', entityId: id },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    this.realtime.emitToRoom(`warehouse:${result.warehouseId}`, 'inventory:updated', result);
    return result;
  }
}
