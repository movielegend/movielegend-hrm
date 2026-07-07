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
            } | null;
        } & {
            description: string | null;
            departmentId: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            deletedAt: Date | null;
            code: string;
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
        } | null;
    } & {
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
    }>;
    create(actor: AuthenticatedUser, dto: CreatePositionDto): Promise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
    }>;
    update(actor: AuthenticatedUser, id: string, dto: UpdatePositionDto): Promise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
    }>;
    remove(actor: AuthenticatedUser, id: string): Promise<{
        description: string | null;
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
    }>;
    private visibleWhere;
    private assertCanRead;
    private canManageGlobally;
    private canReadGlobally;
    private visibleDepartmentIds;
    private assertDepartmentExists;
}
