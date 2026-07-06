import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(dto: CreateDepartmentDto): import("@prisma/client").Prisma.Prisma__DepartmentClient<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        leaderUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(search?: string): Promise<{
        items: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            companyId: string;
            branchId: string | null;
            parentId: string | null;
            leaderUserId: string | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        leaderUserId: string | null;
    }>;
    update(id: string, dto: UpdateDepartmentDto): import("@prisma/client").Prisma.Prisma__DepartmentClient<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        leaderUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        leaderUserId: string | null;
    }>;
}
