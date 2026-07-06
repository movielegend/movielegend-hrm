import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { conflict, forbidden, notFound } from '../../common/utils/error.util';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { CreatePositionDto, PositionQueryDto, UpdatePositionDto } from './dto/position.dto';

@Injectable()
export class PositionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
  ) {}

  async findAll(actor: AuthenticatedUser, query: PositionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.visibleWhere(actor, query);
    const [items, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        include: { department: true },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.position.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(actor: AuthenticatedUser, id: string) {
    const position = await this.prisma.position.findFirst({
      where: { id, deletedAt: null },
      include: { department: true },
    });
    if (!position) throw notFound('POSITION_NOT_FOUND', 'Position not found');
    await this.assertCanRead(actor, position.departmentId);
    return position;
  }

  async create(actor: AuthenticatedUser, dto: CreatePositionDto) {
    if (!this.canManageGlobally(actor)) {
      throw forbidden('FORBIDDEN', 'Missing global position management permission');
    }
    await this.assertDepartmentExists(dto.departmentId);
    try {
      return await this.prisma.position.create({ data: dto });
    } catch (error) {
      if (isUniqueConflict(error)) throw conflict('DUPLICATE_POSITION_CODE', 'Position code already exists');
      throw error;
    }
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdatePositionDto) {
    const current = await this.prisma.position.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw notFound('POSITION_NOT_FOUND', 'Position not found');
    if (!this.canManageGlobally(actor)) {
      throw forbidden('FORBIDDEN', 'Missing global position management permission');
    }
    await this.assertDepartmentExists(dto.departmentId);
    try {
      return await this.prisma.position.update({ where: { id }, data: dto });
    } catch (error) {
      if (isUniqueConflict(error)) throw conflict('DUPLICATE_POSITION_CODE', 'Position code already exists');
      throw error;
    }
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const current = await this.prisma.position.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw notFound('POSITION_NOT_FOUND', 'Position not found');
    if (!this.canManageGlobally(actor)) {
      throw forbidden('FORBIDDEN', 'Missing global position management permission');
    }
    const inUse = await this.prisma.$transaction([
      this.prisma.employeeProfile.count({ where: { positionId: id } }),
      this.prisma.departmentMember.count({ where: { positionId: id, leftAt: null } }),
    ]);
    return this.prisma.position.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: inUse[0] + inUse[1] > 0 ? null : new Date(),
      },
    });
  }

  private async visibleWhere(actor: AuthenticatedUser, query: PositionQueryDto): Promise<Prisma.PositionWhereInput> {
    const base: Prisma.PositionWhereInput = {
      deletedAt: null,
      ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (this.canReadGlobally(actor)) {
      return { ...base, ...(query.departmentId ? { departmentId: query.departmentId } : {}) };
    }

    const allowedDepartmentIds = await this.visibleDepartmentIds(actor);
    if (query.departmentId) {
      if (!allowedDepartmentIds.includes(query.departmentId)) {
        throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Department is outside your scope');
      }
      return { ...base, departmentId: query.departmentId };
    }
    return {
      ...base,
      OR: [{ departmentId: null }, { departmentId: { in: allowedDepartmentIds } }],
    };
  }

  private async assertCanRead(actor: AuthenticatedUser, departmentId: string | null): Promise<void> {
    if (!departmentId || this.canReadGlobally(actor)) return;
    const allowedDepartmentIds = await this.visibleDepartmentIds(actor);
    if (!allowedDepartmentIds.includes(departmentId)) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Department is outside your scope');
    }
  }

  private canManageGlobally(actor: AuthenticatedUser): boolean {
    return actor.roles.includes('ADMIN') || actor.permissions.includes('position.create') || actor.permissions.includes('position.update') || actor.permissions.includes('position.delete');
  }

  private canReadGlobally(actor: AuthenticatedUser): boolean {
    return actor.roles.includes('ADMIN') || actor.roles.includes('HR');
  }

  private async visibleDepartmentIds(actor: AuthenticatedUser): Promise<string[]> {
    const leaderVisible = this.scope.visibleDepartmentIds(actor);
    if (leaderVisible) return leaderVisible;
    const memberships = await this.prisma.departmentMember.findMany({
      where: { userId: actor.userId, leftAt: null },
      select: { departmentId: true },
    });
    return memberships.map((membership) => membership.departmentId);
  }

  private async assertDepartmentExists(departmentId?: string): Promise<void> {
    if (!departmentId) return;
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!department) throw notFound('DEPARTMENT_NOT_FOUND', 'Department not found');
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
