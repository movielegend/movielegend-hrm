import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { AddTaskGroupMemberDto, CreateTaskGroupDto, TaskGroupQueryDto } from './dto/task-group.dto';
export declare class TaskGroupsService {
    private readonly prisma;
    private readonly scope;
    constructor(prisma: PrismaService, scope: DepartmentScopeService);
    create(dto: CreateTaskGroupDto, actor: AuthenticatedUser): Prisma.Prisma__TaskGroupClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
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
    private groupWhere;
    addMember(groupId: string, dto: AddTaskGroupMemberDto, actor: AuthenticatedUser): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        groupId: string;
    }>;
    removeMember(groupId: string, userId: string, actor: AuthenticatedUser): Promise<Prisma.BatchPayload>;
    private groupInclude;
    private paginate;
    private canManageAll;
}
