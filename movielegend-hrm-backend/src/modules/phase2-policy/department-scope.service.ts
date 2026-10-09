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

  /** Returns the region ID if the actor has a REGION scope, null otherwise. */
  getRegionScope(actor: AuthenticatedUser): string | null {
    const scope = actor.scopes?.find(
      (s) => s.scopeType === RoleScopeType.REGION && s.scopeId,
    );
    return scope?.scopeId ?? null;
  }

  /**
   * Resolves the actor's region ID.
   * Checks explicit REGION scope first; if absent and not Global Admin,
   * falls back to the actor's active department -> branch -> regionId ONLY for ADMIN, HR, or ACCOUNTANT.
   * Regular LEADER and EMPLOYEE actors must never inherit broad regional scope.
   */
  async getActorRegionIdAsync(actor: AuthenticatedUser): Promise<string | null> {
    const explicit = this.getRegionScope(actor);
    if (explicit) return explicit;
    if (this.isGlobalAdmin(actor)) return null;

    const isRegionalStaff = actor.roles.includes('ADMIN') || actor.roles.includes('HR');
    if (!isRegionalStaff) return null;

    // Check if actor belongs to a department bound to a region
    const member = await this.prisma.departmentMember.findFirst({
      where: { userId: actor.userId, leftAt: null },
      orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'desc' }],
      include: { department: { select: { branch: { select: { regionId: true } } } } },
    });
    return member?.department?.branch?.regionId ?? null;
  }

  /**
   * Returns all department IDs led by the actor (from explicit scopes and department.leaderUserId).
   */
  async getLedDepartmentIds(actor: AuthenticatedUser): Promise<string[]> {
    const ledFromScopes = actor.scopes
      ?.filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      ?.map((scope) => scope.scopeId as string) || [];

    const ledFromDb = await this.prisma.department.findMany({
      where: {
        leaderUserId: actor.userId,
        deletedAt: null,
      },
      select: { id: true },
    });
    const ledFromDbIds = ledFromDb.map((d) => d.id);

    return Array.from(new Set([...ledFromScopes, ...ledFromDbIds]));
  }

  /** Returns true if the actor has any accounting or finance role. */
  isAccountant(actor: AuthenticatedUser): boolean {
    return (
      actor.roles.some(
        (r) =>
          r === 'ACCOUNTANT' ||
          r === 'ACCOUNTANT_LEAD' ||
          r === 'ACCOUNTANT_PAYROLL' ||
          r.startsWith('ACCOUNTANT') ||
          r.includes('ACCOUNTANT') ||
          r.includes('FINANCE') ||
          r.includes('CFO'),
      ) || false
    );
  }

  /**
   * Sync check — ONLY returns true for Global Admin, or non-region-restricted HR / Accountant,
   * or LEADER of that department.
   * Regional actors (Admin Miền, HR Miền) must use `canAccessDepartmentAsync()`.
   */
  canAccessDepartment(actor: AuthenticatedUser, departmentId: string): boolean {
    if (this.isGlobalAdmin(actor)) return true;
    if (this.getRegionScope(actor)) return false; // Regional actors must use async version
    if (actor.roles.includes('HR') || this.isAccountant(actor)) return true;
    return actor.scopes.some(
      (scope) =>
        scope.role === 'LEADER' &&
        scope.scopeType === RoleScopeType.DEPARTMENT &&
        scope.scopeId === departmentId,
    );
  }

  /**
   * @deprecated Use `getVisibleDepartmentIds()` (async) instead.
   */
  visibleDepartmentIds(actor: AuthenticatedUser): string[] | null {
    if (this.isGlobalAdmin(actor)) return null;
    if (this.isRegionAdmin(actor) || this.getRegionScope(actor)) return [];
    if (actor.roles.includes('HR') || this.isAccountant(actor)) return null;
    return actor.scopes
      .filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }

  /**
   * Async version — correctly returns scoped department IDs:
   * - Global Admin or Global HR/Accountant (no region): null (unrestricted nationwide access)
   * - Region Admin or Regional HR/Accountant (Miền Bắc / Miền Nam): array of department IDs in that region
   * - Leader: ONLY array of led department IDs (never broad region or company)
   * - Employee: ONLY their primary department ID
   */
  async getVisibleDepartmentIds(actor: AuthenticatedUser): Promise<string[] | null> {
    if (this.isGlobalAdmin(actor)) return null;

    // Accountant scope handling:
    // Accountants with explicit region scope -> visible departments in that region.
    // Accountants with global scope or no region scope -> visible to all departments (null).
    if (this.isAccountant(actor)) {
      const explicitRegion = this.getRegionScope(actor);
      if (explicitRegion) {
        const departments = await this.prisma.department.findMany({
          where: {
            deletedAt: null,
            branch: { regionId: explicitRegion, deletedAt: null },
          },
          select: { id: true },
        });
        return departments.map((d) => d.id);
      }
      return null;
    }

    const isRegionalStaff = actor.roles.includes('ADMIN') || actor.roles.includes('HR');

    if (isRegionalStaff) {
      const regionId = await this.getActorRegionIdAsync(actor);
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

      // Unrestricted HR at national level (Head Office)
      return null;
    }

    // Leader: ONLY led departments
    const ledDeptIds = await this.getLedDepartmentIds(actor);
    if (ledDeptIds.length > 0) {
      return ledDeptIds;
    }

    // Fallback for Leader/Employee: their primary department only
    try {
      const primaryId = await this.getPrimaryDepartmentId(actor.userId);
      return [primaryId];
    } catch {
      return [];
    }
  }

  /** Async check — correctly validates department access against visible departments. */
  async canAccessDepartmentAsync(actor: AuthenticatedUser, departmentId: string): Promise<boolean> {
    if (this.isGlobalAdmin(actor)) return true;
    const visibleDepts = await this.getVisibleDepartmentIds(actor);
    if (visibleDepts === null) return true;
    return visibleDepts.includes(departmentId);
  }

  /**
   * Sync assertion — safe for Global Admin, HR, Accountant, and LEADER.
   * For Regional actors, use `assertDepartmentAccessAsync()` instead.
   */
  assertDepartmentAccess(actor: AuthenticatedUser, departmentId: string): void {
    if (!this.canAccessDepartment(actor, departmentId)) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban này');
    }
  }

  /** Async assertion — correctly handles Region Admin, Regional HR, and LEADER scope checking. */
  async assertDepartmentAccessAsync(actor: AuthenticatedUser, departmentId: string): Promise<void> {
    const allowed = await this.canAccessDepartmentAsync(actor, departmentId);
    if (!allowed) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền thao tác với phòng ban này');
    }
  }

  /** Check if a target user is within the actor's scope (for admin & HR operations). */
  async assertUserInScope(actor: AuthenticatedUser, targetUserId: string): Promise<void> {
    if (this.isGlobalAdmin(actor)) return;
    const visibleDepts = await this.getVisibleDepartmentIds(actor);
    if (visibleDepts === null) return;

    if (visibleDepts.length > 0) {
      const isMember = await this.prisma.departmentMember.findFirst({
        where: { userId: targetUserId, departmentId: { in: visibleDepts }, leftAt: null },
      });
      if (isMember) return;
    }

    throw forbidden('FORBIDDEN_REGION_SCOPE', 'Người dùng này không thuộc miền/phòng ban bạn quản lý');
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

