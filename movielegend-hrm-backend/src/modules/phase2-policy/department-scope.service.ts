import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DepartmentScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns true only if the actor has ADMIN role with GLOBAL scope (no region restriction). */
  isGlobalAdmin(actor: AuthenticatedUser): boolean {
    if (!actor.roles.includes('ADMIN')) return false;
    return !this.isRegionAdmin(actor);
  }

  /** Returns true if the actor has ADMIN role scoped to a specific REGION. */
  isRegionAdmin(actor: AuthenticatedUser): boolean {
    return this.getRegionScope(actor) !== null;
  }

  /** Returns the region ID if the actor is a Region Admin, null otherwise. */
  getRegionScope(actor: AuthenticatedUser): string | null {
    if (!actor.roles.includes('ADMIN')) return null;
    const scope = actor.scopes?.find(
      (s) => s.role === 'ADMIN' && s.scopeType === RoleScopeType.REGION && s.scopeId,
    );
    return scope?.scopeId ?? null;
  }

  /**
   * Sync check — ONLY returns true for Global Admin, HR, Accountant, or LEADER of that department.
   * Region Admins must use the async version `canAccessDepartmentAsync()`.
   * NOTE: This method deliberately returns FALSE for Region Admins to force callers
   * to use the async version that can query the DB for region-department mapping.
   */
  canAccessDepartment(actor: AuthenticatedUser, departmentId: string): boolean {
    if (this.isGlobalAdmin(actor) || actor.roles.includes('HR') || actor.roles.includes('ACCOUNTANT')) return true;
    // Region admins are NOT granted blanket access here — must use async version
    return actor.scopes.some(
      (scope) =>
        scope.role === 'LEADER' &&
        scope.scopeType === RoleScopeType.DEPARTMENT &&
        scope.scopeId === departmentId,
    );
  }

  /**
   * @deprecated Use `getVisibleDepartmentIds()` (async) instead.
   * Sync version — returns null (= all) only for Global Admin, HR, Accountant.
   * Region Admins get an empty array here (conservative), callers should use async version.
   */
  visibleDepartmentIds(actor: AuthenticatedUser): string[] | null {
    if (this.isGlobalAdmin(actor) || actor.roles.includes('HR') || actor.roles.includes('ACCOUNTANT')) return null;
    // Region admins: return empty array (conservative) — callers should use async version
    if (this.isRegionAdmin(actor)) return [];
    return actor.scopes
      .filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }

  /** Async version — correctly filters departments by region for Region Admins. */
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
    if (this.isGlobalAdmin(actor)) return null;
    return actor.scopes
      .filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }

  /** Async check — correctly validates Region Admin access via DB lookup. */
  async canAccessDepartmentAsync(actor: AuthenticatedUser, departmentId: string): Promise<boolean> {
    if (actor.roles.includes('HR') || actor.roles.includes('ACCOUNTANT')) return true;
    if (this.isGlobalAdmin(actor)) return true;
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

  /**
   * Sync assertion — safe for Global Admin, HR, Accountant, and LEADER.
   * For Region Admin callers, use `assertDepartmentAccessAsync()` instead.
   */
  assertDepartmentAccess(actor: AuthenticatedUser, departmentId: string): void {
    if (!this.canAccessDepartment(actor, departmentId)) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban này');
    }
  }

  /** Async assertion — correctly handles Region Admin scope checking. */
  async assertDepartmentAccessAsync(actor: AuthenticatedUser, departmentId: string): Promise<void> {
    const allowed = await this.canAccessDepartmentAsync(actor, departmentId);
    if (!allowed) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban ngoài miền phụ trách');
    }
  }

  /** Check if a target user is within the actor's scope (for admin operations). */
  async assertUserInScope(actor: AuthenticatedUser, targetUserId: string): Promise<void> {
    if (this.isGlobalAdmin(actor) || actor.roles.includes('HR')) return;
    const regionId = this.getRegionScope(actor);
    if (!regionId) {
      if (actor.roles.includes('LEADER')) {
        const visibleDepts = await this.getVisibleDepartmentIds(actor);
        if (visibleDepts && visibleDepts.length > 0) {
          const isMember = await this.prisma.departmentMember.findFirst({
            where: { userId: targetUserId, departmentId: { in: visibleDepts }, leftAt: null },
          });
          if (isMember) return;
        }
      }
      // Not a global admin, not HR, not region admin, not leader of this user
      throw forbidden('FORBIDDEN_SCOPE', 'Bạn không có quyền thao tác với người dùng này');
    }
    // Region admin: check if target user's primary department is in this region
    const member = await this.prisma.departmentMember.findFirst({
      where: { userId: targetUserId, leftAt: null },
      include: { department: { select: { branch: { select: { regionId: true } } } } },
    });
    if (!member || member.department?.branch?.regionId !== regionId) {
      throw forbidden('FORBIDDEN_REGION_SCOPE', 'Người dùng này không thuộc miền bạn quản lý');
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

