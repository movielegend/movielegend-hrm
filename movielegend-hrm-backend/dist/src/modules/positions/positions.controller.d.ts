import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreatePositionDto, PositionQueryDto, UpdatePositionDto } from './dto/position.dto';
import { PositionsService } from './positions.service';
export declare class PositionsController {
    private readonly positionsService;
    constructor(positionsService: PositionsService);
    findAll(user: AuthenticatedUser, query: PositionQueryDto): Promise<{
        items: ({
            department: {
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
    findOne(user: AuthenticatedUser, id: string): Promise<{
        department: {
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
    create(user: AuthenticatedUser, dto: CreatePositionDto): Promise<{
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
    update(user: AuthenticatedUser, id: string, dto: UpdatePositionDto): Promise<{
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
    remove(user: AuthenticatedUser, id: string): Promise<{
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
}
