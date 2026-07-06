import { PrismaService } from '../../database/prisma.service';
import { CreateMaterialCategoryDto, CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
export declare class MaterialsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCategory(dto: CreateMaterialCategoryDto): import("@prisma/client").Prisma.Prisma__MaterialCategoryClient<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findCategories(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    create(dto: CreateMaterialDto): Promise<{
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
        categoryId: string;
        unit: string;
        materialCode: string;
        minimumStock: import("@prisma/client/runtime/library").Decimal;
        maximumStock: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
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
        categoryId: string;
        unit: string;
        materialCode: string;
        minimumStock: import("@prisma/client/runtime/library").Decimal;
        maximumStock: import("@prisma/client/runtime/library").Decimal | null;
    })[]>;
    findOne(id: string): Promise<{
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
        categoryId: string;
        unit: string;
        materialCode: string;
        minimumStock: import("@prisma/client/runtime/library").Decimal;
        maximumStock: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: string, dto: UpdateMaterialDto): Promise<{
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
        categoryId: string;
        unit: string;
        materialCode: string;
        minimumStock: import("@prisma/client/runtime/library").Decimal;
        maximumStock: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
