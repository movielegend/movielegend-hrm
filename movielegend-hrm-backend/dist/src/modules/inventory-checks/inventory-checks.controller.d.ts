import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateInventoryCheckDto, UpdateInventoryCheckItemsDto } from './dto/inventory-check.dto';
import { InventoryChecksService } from './inventory-checks.service';
export declare class InventoryChecksController {
    private readonly checks;
    constructor(checks: InventoryChecksService);
    create(dto: CreateInventoryCheckDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        items: {
            id: string;
            note: string | null;
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
