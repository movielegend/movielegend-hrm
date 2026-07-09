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
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        address: string | null;
        allowedRadius: number | null;
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
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        address: string | null;
        allowedRadius: number | null;
    })[]>;
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
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        address: string | null;
        allowedRadius: number | null;
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
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        address: string | null;
        allowedRadius: number | null;
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
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        address: string | null;
        allowedRadius: number | null;
    }>;
}
