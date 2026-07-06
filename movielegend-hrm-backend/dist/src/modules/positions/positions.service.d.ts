import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { CreatePositionDto, PositionQueryDto, UpdatePositionDto } from './dto/position.dto';
export declare class PositionsService {
    private readonly prisma;
    private readonly scope;
    constructor(prisma: PrismaService, scope: DepartmentScopeService);
    findAll(actor: AuthenticatedUser, query: PositionQueryDto): Promise<{
        items: ({
            department: {
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
            } | null;
        } & {
            id: string;
            code: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(actor: AuthenticatedUser, id: string): Promise<{
        department: {
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
        } | null;
    } & {
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
    }>;
    create(actor: AuthenticatedUser, dto: CreatePositionDto): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
    }>;
    update(actor: AuthenticatedUser, id: string, dto: UpdatePositionDto): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
    }>;
    remove(actor: AuthenticatedUser, id: string): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
    }>;
    private visibleWhere;
    private assertCanRead;
    private canManageGlobally;
    private canReadGlobally;
    private visibleDepartmentIds;
    private assertDepartmentExists;
}
