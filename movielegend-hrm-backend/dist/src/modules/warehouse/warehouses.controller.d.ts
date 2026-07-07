import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';
export declare class WarehousesController {
    private readonly warehouses;
    constructor(warehouses: WarehousesService);
    create(dto: CreateWarehouseDto, actor: AuthenticatedUser): Promise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        code: string;
        address: string | null;
        managerUserId: string | null;
    }>;
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        code: string;
        address: string | null;
        managerUserId: string | null;
    }[]>;
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        code: string;
        address: string | null;
        managerUserId: string | null;
    }>;
    update(id: string, dto: UpdateWarehouseDto, actor: AuthenticatedUser): Promise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        code: string;
        address: string | null;
        managerUserId: string | null;
    }>;
    close(id: string, actor: AuthenticatedUser): Promise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        code: string;
        address: string | null;
        managerUserId: string | null;
    }>;
    stocks(id: string, actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        material: {
            category: {
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                code: string;
            };
        } & {
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            deletedAt: Date | null;
            categoryId: string;
            unit: string;
            materialCode: string;
            minimumStock: import("@prisma/client/runtime/library").Decimal;
            maximumStock: import("@prisma/client/runtime/library").Decimal | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        warehouseId: string;
        materialId: string;
        quantityOnHand: import("@prisma/client/runtime/library").Decimal;
        quantityReserved: import("@prisma/client/runtime/library").Decimal;
        version: number;
    })[]>;
}
