import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WarehouseScopeService {
  constructor(private readonly prisma: PrismaService) {}

  getRegionScope(actor: AuthenticatedUser): string | null {
    if (!actor.roles.includes('ADMIN')) return null;
    const scope = actor.scopes?.find(
      (s) => s.role === 'ADMIN' && s.scopeType === RoleScopeType.REGION && s.scopeId,
    );
    return scope?.scopeId ?? null;
  }

  async canAccessWarehouse(actor: AuthenticatedUser, warehouseId: string): Promise<boolean> {
    if (actor.roles.includes('ADMIN')) {
      const regionId = this.getRegionScope(actor);
      if (regionId) {
        const warehouse = await this.prisma.warehouse.findUnique({
          where: { id: warehouseId },
          select: { branch: { select: { regionId: true } } },
        });
        return warehouse?.branch?.regionId === regionId;
      }
      return true; // Global Admin
    }
    return actor.scopes.some(
      (scope) =>
        scope.role === 'WAREHOUSE_MANAGER' &&
        scope.scopeType === RoleScopeType.WAREHOUSE &&
        scope.scopeId === warehouseId,
    );
  }

  async canAccessWarehouseAsync(actor: AuthenticatedUser, warehouseId: string): Promise<boolean> {
    return this.canAccessWarehouse(actor, warehouseId);
  }

  async assertWarehouseAccess(actor: AuthenticatedUser, warehouseId: string): Promise<void> {
    if (!(await this.canAccessWarehouse(actor, warehouseId))) {
      throw forbidden('FORBIDDEN_WAREHOUSE_SCOPE', 'Bạn không có quyền truy cập kho này');
    }
  }

  async assertWarehouseAccessAsync(actor: AuthenticatedUser, warehouseId: string): Promise<void> {
    return this.assertWarehouseAccess(actor, warehouseId);
  }

  async visibleWarehouseIds(actor: AuthenticatedUser): Promise<string[] | null> {
    if (actor.roles.includes('ADMIN')) {
      const regionId = this.getRegionScope(actor);
      if (regionId) {
        const warehouses = await this.prisma.warehouse.findMany({
          where: { deletedAt: null, branch: { regionId, deletedAt: null } },
          select: { id: true },
        });
        return warehouses.map(w => w.id);
      }
      return null; // Global Admin
    }
    return actor.scopes
      .filter((scope) => scope.role === 'WAREHOUSE_MANAGER' && scope.scopeType === RoleScopeType.WAREHOUSE && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }

  async assertWarehouseExists(warehouseId: string): Promise<void> {
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, deletedAt: null } });
    if (!warehouse) throw notFound('WAREHOUSE_NOT_FOUND', 'Warehouse not found');
  }
}
