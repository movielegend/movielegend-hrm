import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AddTaskGroupMemberDto, CreateTaskGroupDto, TaskGroupQueryDto } from './dto/task-group.dto';
import { TaskGroupsService } from './task-groups.service';
export declare class TaskGroupsController {
    private readonly groups;
    constructor(groups: TaskGroupsService);
    create(dto: CreateTaskGroupDto, actor: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__TaskGroupClient<{
        members: {
            userId: string;
            id: string;
            createdAt: Date;
            groupId: string;
        }[];
    } & {
        description: string | null;
        departmentId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        createdByUserId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(actor: AuthenticatedUser, query: TaskGroupQueryDto): Promise<{
        items: ({
            department: {
                id: string;
                name: string;
                code: string;
            };
            members: ({
                user: {
                    id: string;
                    userCode: string;
                    profile: {
                        position: {
                            id: string;
                            name: string;
                        } | null;
                        fullName: string;
                        avatarUrl: string | null;
                    } | null;
                };
            } & {
                userId: string;
                id: string;
                createdAt: Date;
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
            description: string | null;
            departmentId: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            deletedAt: Date | null;
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
            name: string;
            code: string;
        };
        members: ({
            user: {
                id: string;
                userCode: string;
                profile: {
                    position: {
                        id: string;
                        name: string;
                    } | null;
                    fullName: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
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
        description: string | null;
        departmentId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        createdByUserId: string;
    }>;
    addMember(id: string, dto: AddTaskGroupMemberDto, actor: AuthenticatedUser): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        groupId: string;
    }>;
    removeMember(id: string, userId: string, actor: AuthenticatedUser): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
