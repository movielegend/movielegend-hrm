import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    create(createBranchDto: CreateBranchDto): Promise<{
        departments: {
            id: string;
            code: string;
            name: string;
        }[];
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        address: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        allowedRadius: number | null;
        allowedIps: string[];
    }>;
    findAll(): Promise<({
        departments: {
            id: string;
            code: string;
            name: string;
        }[];
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        address: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        allowedRadius: number | null;
        allowedIps: string[];
    })[]>;
    restoreDeleted(): Promise<import("@prisma/client").Prisma.BatchPayload>;
    findOne(id: string): Promise<{
        departments: {
            id: string;
            code: string;
            name: string;
        }[];
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        address: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        allowedRadius: number | null;
        allowedIps: string[];
    }>;
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<{
        departments: {
            id: string;
            code: string;
            name: string;
        }[];
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        address: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        allowedRadius: number | null;
        allowedIps: string[];
    }>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        address: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        allowedRadius: number | null;
        allowedIps: string[];
    }>;
}
