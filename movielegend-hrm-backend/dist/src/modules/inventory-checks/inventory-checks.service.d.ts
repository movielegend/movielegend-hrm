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
            materialId: string | null;
            actualQuantity: Prisma.Decimal | null;
            systemQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        startedAt: Date;
        completedAt: Date | null;
        checkCode: string;
    }>;
    findAll(actor: AuthenticatedUser): Prisma.PrismaPromise<({
        items: {
            id: string;
            note: string | null;
            materialId: string | null;
            actualQuantity: Prisma.Decimal | null;
            systemQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        startedAt: Date;
        completedAt: Date | null;
        checkCode: string;
    })[]>;
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string | null;
            actualQuantity: Prisma.Decimal | null;
            systemQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        startedAt: Date;
        completedAt: Date | null;
        checkCode: string;
    }>;
    updateItems(id: string, dto: UpdateInventoryCheckItemsDto, actor: AuthenticatedUser): Promise<({
        items: {
            id: string;
            note: string | null;
            materialId: string | null;
            actualQuantity: Prisma.Decimal | null;
            systemQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        startedAt: Date;
        completedAt: Date | null;
        checkCode: string;
    }) | null>;
    submit(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        startedAt: Date;
        completedAt: Date | null;
        checkCode: string;
    }>;
    approve(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string | null;
            actualQuantity: Prisma.Decimal | null;
            systemQuantity: Prisma.Decimal | null;
            differenceQuantity: Prisma.Decimal | null;
            inventoryCheckId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.InventoryCheckStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        startedAt: Date;
        completedAt: Date | null;
        checkCode: string;
    }>;
}
