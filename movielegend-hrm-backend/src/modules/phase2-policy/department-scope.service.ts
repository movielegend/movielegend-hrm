import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DepartmentScopeService {
  constructor(private readonly prisma: PrismaService) {}

  canAccessDepartment(actor: AuthenticatedUser, departmentId: string): boolean {
    if (actor.roles.includes('ADMIN')) return true;
    return actor.scopes.some(
      (scope) =>
        scope.role === 'LEADER' &&
        scope.scopeType === RoleScopeType.DEPARTMENT &&
        scope.scopeId === departmentId,
    );
  }

  visibleDepartmentIds(actor: AuthenticatedUser): string[] | null {
    if (actor.roles.includes('ADMIN')) return null;
    return actor.scopes
      .filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }

  assertDepartmentAccess(actor: AuthenticatedUser, departmentId: string): void {
    if (!this.canAccessDepartment(actor, departmentId)) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban này');
    }
  }

  async getPrimaryDepartmentId(userId: string): Promise<string> {
    const member = await this.prisma.departmentMember.findFirst({
      where: { userId, leftAt: null, isPrimary: true },
      orderBy: { joinedAt: 'desc' },
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
