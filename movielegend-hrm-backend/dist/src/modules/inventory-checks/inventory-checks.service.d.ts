import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { StockService } from '../stock/stock.service';
import { WarehouseScopeService } from '../warehouse/warehouse-scope.service';
import { CreateInventoryCheckDto, UpdateInventoryCheckItemsDto } from './dto/inventory-check.dto';
export declare class InventoryChecksService {
    private readonly prisma;
    private readonly warehouses;
    private readonly stock;
    private readonly realtime;
    constructor(prisma: PrismaService, warehouses: WarehouseScopeService, stock: StockService, realtime: RealtimeEventsService);
    create(dto: CreateInventoryCheckDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            systemQuantity: Prisma.Decimal | null;
            actualQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            materialId: string | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        warehouseId: string;
        checkCode: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        startedAt: Date;
        completedAt: Date | null;
        createdById: string;
        approvedById: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(actor: AuthenticatedUser): Prisma.PrismaPromise<({
        items: {
            id: string;
            note: string | null;
            systemQuantity: Prisma.Decimal | null;
            actualQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            materialId: string | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        warehouseId: string;
        checkCode: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        startedAt: Date;
        completedAt: Date | null;
        createdById: string;
        approvedById: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            systemQuantity: Prisma.Decimal | null;
            actualQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            materialId: string | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        warehouseId: string;
        checkCode: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        startedAt: Date;
        completedAt: Date | null;
        createdById: string;
        approvedById: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateItems(id: string, dto: UpdateInventoryCheckItemsDto, actor: AuthenticatedUser): Promise<({
        items: {
            id: string;
            note: string | null;
            systemQuantity: Prisma.Decimal | null;
            actualQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            materialId: string | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        warehouseId: string;
        checkCode: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        startedAt: Date;
        completedAt: Date | null;
        createdById: string;
        approvedById: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    submit(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        warehouseId: string;
        checkCode: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        startedAt: Date;
        completedAt: Date | null;
        createdById: string;
        approvedById: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    approve(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            systemQuantity: Prisma.Decimal | null;
            actualQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            materialId: string | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        warehouseId: string;
        checkCode: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        startedAt: Date;
        completedAt: Date | null;
        createdById: string;
        approvedById: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
