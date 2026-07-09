import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { WarehouseScopeService } from './warehouse-scope.service';
export declare class WarehousesService {
    private readonly prisma;
    private readonly warehouseScope;
    constructor(prisma: PrismaService, warehouseScope: WarehouseScopeService);
    create(dto: CreateWarehouseDto, actor: AuthenticatedUser): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        address: string | null;
        managerUserId: string | null;
    }>;
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        address: string | null;
        managerUserId: string | null;
    }[]>;
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        address: string | null;
        managerUserId: string | null;
    }>;
    update(id: string, dto: UpdateWarehouseDto, actor: AuthenticatedUser): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        address: string | null;
        managerUserId: string | null;
    }>;
    close(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        address: string | null;
        managerUserId: string | null;
    }>;
    stocks(id: string, actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        material: {
            category: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
            };
        } & {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            unit: string;
            categoryId: string;
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
