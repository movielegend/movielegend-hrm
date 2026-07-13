import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AddTaskGroupMemberDto, CreateTaskGroupDto, TaskGroupQueryDto } from './dto/task-group.dto';
import { TaskGroupsService } from './task-groups.service';
export declare class TaskGroupsController {
    private readonly groups;
    constructor(groups: TaskGroupsService);
    create(dto: CreateTaskGroupDto, actor: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__TaskGroupClient<{
        members: {
            id: string;
            createdAt: Date;
            userId: string;
            groupId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string;
        createdByUserId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(actor: AuthenticatedUser, query: TaskGroupQueryDto): Promise<{
        items: ({
            department: {
                id: string;
                code: string;
                name: string;
            };
            members: ({
                user: {
                    id: string;
                    userCode: string;
                    profile: {
                        fullName: string;
                        avatarUrl: string | null;
                        position: {
                            id: string;
                            name: string;
                        } | null;
                    } | null;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                groupId: string;
            })[];
            createdBy: {
                id: string;
                userCode: string;
                profile: {
                    fullName: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentId: string;
            createdByUserId: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        department: {
            id: string;
            code: string;
            name: string;
        };
        members: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    fullName: string;
                    avatarUrl: string | null;
                    position: {
                        id: string;
                        name: string;
                    } | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            groupId: string;
        })[];
        createdBy: {
            id: string;
            userCode: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string;
        createdByUserId: string;
    }>;
    addMember(id: string, dto: AddTaskGroupMemberDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        groupId: string;
    }>;
    removeMember(id: string, userId: string, actor: AuthenticatedUser): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
