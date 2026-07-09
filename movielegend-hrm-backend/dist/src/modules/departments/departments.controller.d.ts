import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(dto: CreateDepartmentDto): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        name: string;
        description: string | null;
        leaderUserId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findPublic(search?: string): Promise<{
        items: {
            id: string;
            companyId: string;
            branchId: string | null;
            parentId: string | null;
            code: string;
            name: string;
            description: string | null;
            leaderUserId: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        }[];
    }>;
    findAll(search?: string): Promise<{
        items: {
            id: string;
            companyId: string;
            branchId: string | null;
            parentId: string | null;
            code: string;
            name: string;
            description: string | null;
            leaderUserId: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        name: string;
        description: string | null;
        leaderUserId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    update(id: string, dto: UpdateDepartmentDto): import("@prisma/client").Prisma.Prisma__DepartmentClient<{
        id: string;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        name: string;
        description: string | null;
        leaderUserId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        name: string;
        description: string | null;
        leaderUserId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
