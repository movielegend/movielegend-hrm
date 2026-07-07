import { PrismaService } from '../../database/prisma.service';
import { CreateMaterialCategoryDto, CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
export declare class MaterialsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCategory(dto: CreateMaterialCategoryDto): import("@prisma/client").Prisma.Prisma__MaterialCategoryClient<{
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findCategories(): import("@prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
    }[]>;
    create(dto: CreateMaterialDto): Promise<{
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
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
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
    })[]>;
    findOne(id: string): Promise<{
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
    }>;
    update(id: string, dto: UpdateMaterialDto): Promise<{
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
    }>;
}
