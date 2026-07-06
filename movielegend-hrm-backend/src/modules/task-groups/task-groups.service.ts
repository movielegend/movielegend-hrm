import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { AddTaskGroupMemberDto, CreateTaskGroupDto, TaskGroupQueryDto } from './dto/task-group.dto';

@Injectable()
export class TaskGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
  ) {}

  create(dto: CreateTaskGroupDto, actor: AuthenticatedUser) {
    this.scope.assertDepartmentAccess(actor, dto.departmentId);
    return this.prisma.taskGroup.create({
      data: {
        departmentId: dto.departmentId,
        name: dto.name,
        description: dto.description,
        createdByUserId: actor.userId,
      },
      include: { members: true },
    });
  }

  async findAll(actor: AuthenticatedUser, query: TaskGroupQueryDto) {
    const where = this.groupWhere(actor, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.taskGroup.findMany({
        where,
        include: this.groupInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.taskGroup.count({ where }),
    ]);
    return this.paginate(items, total, query.page, query.limit);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const group = await this.prisma.taskGroup.findUnique({
      where: { id },
      include: this.groupInclude(),
    });
    if (!group || group.deletedAt) throw notFound('TASK_GROUP_NOT_FOUND', 'Task group not found');
    if (!this.canManageAll(actor)) this.scope.assertDepartmentAccess(actor, group.departmentId);
    return group;
  }

  private groupWhere(actor: AuthenticatedUser, query: TaskGroupQueryDto): Prisma.TaskGroupWhereInput {
    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
    if (query.departmentId && visibleDepartmentIds && !visibleDepartmentIds.includes(query.departmentId)) {
      throw forbidden('TASK_GROUP_FORBIDDEN', 'Task group department is out of scope');
    }
    return {
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : visibleDepartmentIds ? { departmentId: { in: visibleDepartmentIds } } : {}),
    };
  }

  async addMember(groupId: string, dto: AddTaskGroupMemberDto, actor: AuthenticatedUser) {
    const group = await this.prisma.taskGroup.findUnique({ where: { id: groupId } });
    if (!group || group.deletedAt) throw notFound('TASK_GROUP_NOT_FOUND', 'Task group not found');
    this.scope.assertDepartmentAccess(actor, group.departmentId);
    await this.scope.assertUserInDepartment(dto.userId, group.departmentId);
    return this.prisma.taskGroupMember.upsert({
      where: { groupId_userId: { groupId, userId: dto.userId } },
      update: {},
      create: { groupId, userId: dto.userId },
    });
  }

  async removeMember(groupId: string, userId: string, actor: AuthenticatedUser) {
    const group = await this.prisma.taskGroup.findUnique({ where: { id: groupId } });
    if (!group || group.deletedAt) throw notFound('TASK_GROUP_NOT_FOUND', 'Task group not found');
    this.scope.assertDepartmentAccess(actor, group.departmentId);
    return this.prisma.taskGroupMember.deleteMany({ where: { groupId, userId } });
  }

  private groupInclude() {
    return {
      department: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true, avatarUrl: true, position: { select: { id: true, name: true } } } },
            },
          },
        },
      },
    };
  }

  private paginate<T>(items: T[], total: number, page: number, limit: number) {
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private canManageAll(actor: AuthenticatedUser): boolean {
    return actor.roles.includes('ADMIN') || actor.permissions.includes('task.group.manage_all');
  }
}
