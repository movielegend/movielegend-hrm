import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WarehouseScopeService {
  constructor(private readonly prisma: PrismaService) {}

  canAccessWarehouse(actor: AuthenticatedUser, warehouseId: string): boolean {
    if (actor.roles.includes('ADMIN')) return true;
    return actor.scopes.some(
      (scope) =>
        scope.role === 'WAREHOUSE_MANAGER' &&
        scope.scopeType === RoleScopeType.WAREHOUSE &&
        scope.scopeId === warehouseId,
    );
  }

  assertWarehouseAccess(actor: AuthenticatedUser, warehouseId: string): void {
    if (!this.canAccessWarehouse(actor, warehouseId)) {
      throw forbidden('FORBIDDEN_WAREHOUSE_SCOPE', 'Cannot access this warehouse');
    }
  }

  visibleWarehouseIds(actor: AuthenticatedUser): string[] | null {
    if (actor.roles.includes('ADMIN')) return null;
    return actor.scopes
      .filter((scope) => scope.role === 'WAREHOUSE_MANAGER' && scope.scopeType === RoleScopeType.WAREHOUSE && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }

  async assertWarehouseExists(warehouseId: string): Promise<void> {
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, deletedAt: null } });
    if (!warehouse) throw notFound('WAREHOUSE_NOT_FOUND', 'Warehouse not found');
  }
}
