import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
export declare class WarehouseScopeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    canAccessWarehouse(actor: AuthenticatedUser, warehouseId: string): boolean;
    assertWarehouseAccess(actor: AuthenticatedUser, warehouseId: string): void;
    visibleWarehouseIds(actor: AuthenticatedUser): string[] | null;
    assertWarehouseExists(warehouseId: string): Promise<void>;
}
