import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreatePositionDto, PositionQueryDto, UpdatePositionDto } from './dto/position.dto';
import { PositionsService } from './positions.service';
export declare class PositionsController {
    private readonly positionsService;
    constructor(positionsService: PositionsService);
    findAll(user: AuthenticatedUser, query: PositionQueryDto): Promise<{
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
    findOne(user: AuthenticatedUser, id: string): Promise<{
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
    create(user: AuthenticatedUser, dto: CreatePositionDto): Promise<{
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
    update(user: AuthenticatedUser, id: string, dto: UpdatePositionDto): Promise<{
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
    remove(user: AuthenticatedUser, id: string): Promise<{
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
}
