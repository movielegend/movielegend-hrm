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
            materialId: string | null;
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        items: {
            id: string;
            note: string | null;
            materialId: string | null;
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
            actualQuantity: import("@prisma/client/runtime/library").Decimal | null;
            systemQuantity: import("@prisma/client/runtime/library").Decimal | null;
            differenceQuantity: import("@prisma/client/runtime/library").Decimal | null;
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
