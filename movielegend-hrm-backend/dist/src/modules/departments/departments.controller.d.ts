import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(dto: CreateDepartmentDto): import("@prisma/client").Prisma.Prisma__DepartmentClient<{
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        leaderUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(search?: string): Promise<{
        items: {
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            deletedAt: Date | null;
            companyId: string;
            branchId: string | null;
            parentId: string | null;
            code: string;
            leaderUserId: string | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        leaderUserId: string | null;
    }>;
    update(id: string, dto: UpdateDepartmentDto): import("@prisma/client").Prisma.Prisma__DepartmentClient<{
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        leaderUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        companyId: string;
        branchId: string | null;
        parentId: string | null;
        code: string;
        leaderUserId: string | null;
    }>;
}
