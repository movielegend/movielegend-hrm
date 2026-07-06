import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { WarehouseScopeService } from './warehouse-scope.service';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly warehouseScope: WarehouseScopeService,
  ) {}

  create(dto: CreateWarehouseDto, actor: AuthenticatedUser) {
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

  findAll(actor: AuthenticatedUser) {
    const visibleIds = this.warehouseScope.visibleWarehouseIds(actor);
    return this.prisma.warehouse.findMany({
      where: { deletedAt: null, ...(visibleIds ? { id: { in: visibleIds } } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    this.warehouseScope.assertWarehouseAccess(actor, id);
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
    if (!warehouse) throw notFound('WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto, actor: AuthenticatedUser) {
    this.warehouseScope.assertWarehouseAccess(actor, id);
    await this.warehouseScope.assertWarehouseExists(id);
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async close(id: string, actor: AuthenticatedUser) {
    this.warehouseScope.assertWarehouseAccess(actor, id);
    await this.warehouseScope.assertWarehouseExists(id);
    return this.prisma.warehouse.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  }

  stocks(id: string, actor: AuthenticatedUser) {
    this.warehouseScope.assertWarehouseAccess(actor, id);
    return this.prisma.warehouseStock.findMany({
      where: { warehouseId: id },
      include: { material: { include: { category: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
