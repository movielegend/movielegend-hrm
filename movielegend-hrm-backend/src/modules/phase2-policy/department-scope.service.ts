import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DepartmentScopeService {
  constructor(private readonly prisma: PrismaService) {}

  getRegionScope(actor: AuthenticatedUser): string | null {
    if (!actor.roles.includes('ADMIN')) return null;
    const scope = actor.scopes?.find(
      (s) => s.role === 'ADMIN' && s.scopeType === RoleScopeType.REGION && s.scopeId,
    );
    return scope?.scopeId ?? null;
  }

  canAccessDepartment(actor: AuthenticatedUser, departmentId: string): boolean {
    if (actor.roles.includes('ADMIN') || actor.roles.includes('HR') || actor.roles.includes('ACCOUNTANT')) return true;
    return actor.scopes.some(
      (scope) =>
        scope.role === 'LEADER' &&
        scope.scopeType === RoleScopeType.DEPARTMENT &&
        scope.scopeId === departmentId,
    );
  }

  visibleDepartmentIds(actor: AuthenticatedUser): string[] | null {
    if (actor.roles.includes('ADMIN') || actor.roles.includes('HR') || actor.roles.includes('ACCOUNTANT')) return null;
    return actor.scopes
      .filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }

  async getVisibleDepartmentIds(actor: AuthenticatedUser): Promise<string[] | null> {
    if (actor.roles.includes('HR') || actor.roles.includes('ACCOUNTANT')) return null;
    const regionId = this.getRegionScope(actor);
    if (regionId) {
      const departments = await this.prisma.department.findMany({
        where: {
          deletedAt: null,
          branch: { regionId, deletedAt: null },
        },
        select: { id: true },
      });
      return departments.map((d) => d.id);
    }
    if (actor.roles.includes('ADMIN')) return null;
    return this.visibleDepartmentIds(actor);
  }

  async canAccessDepartmentAsync(actor: AuthenticatedUser, departmentId: string): Promise<boolean> {
    if (actor.roles.includes('HR')) return true;
    const regionId = this.getRegionScope(actor);
    if (regionId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: departmentId },
        select: { branch: { select: { regionId: true } } },
      });
      return dept?.branch?.regionId === regionId;
    }
    return this.canAccessDepartment(actor, departmentId);
  }

  assertDepartmentAccess(actor: AuthenticatedUser, departmentId: string): void {
    if (!this.canAccessDepartment(actor, departmentId)) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban này');
    }
  }

  async assertDepartmentAccessAsync(actor: AuthenticatedUser, departmentId: string): Promise<void> {
    const allowed = await this.canAccessDepartmentAsync(actor, departmentId);
    if (!allowed) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban ngoài miền phụ trách');
    }
  }

  async getPrimaryDepartmentId(userId: string): Promise<string> {
    const member = await this.prisma.departmentMember.findFirst({
      where: { userId, leftAt: null },
      orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'desc' }],
    });
    if (!member) throw notFound('DEPARTMENT_MEMBER_NOT_FOUND', 'User chưa thuộc phòng ban active');
    return member.departmentId;
  }

  async assertUserInDepartment(userId: string, departmentId: string): Promise<void> {
    const member = await this.prisma.departmentMember.findFirst({
      where: { userId, departmentId, leftAt: null },
    });
    if (!member) {
      throw forbidden('USER_NOT_IN_DEPARTMENT', 'Nhân viên không thuộc phòng ban này');
    }
  }
}
