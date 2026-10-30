import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';

@Injectable()
export class ApprovalPolicyService {
  constructor(private readonly scopes: DepartmentScopeService) {}

  async canApproveDepartment(user: AuthenticatedUser, departmentId: string): Promise<boolean> {
    if (
      !user.permissions.includes('employee.approve') &&
      !user.permissions.includes('approval.approve') &&
      !user.roles.includes('ADMIN')
    ) {
      return false;
    }
    
    const visibleDepts = await this.visibleDepartmentIds(user);
    if (visibleDepts === null) return true;
    return visibleDepts.includes(departmentId);
  }

  async visibleDepartmentIds(user: AuthenticatedUser): Promise<string[] | null> {
    // ADMIN and HR can approve accounts company-wide (or region-wide if regional admin/hr)
    if (user.roles.includes('ADMIN') || user.roles.includes('HR')) {
      return this.scopes?.getVisibleDepartmentIds ? this.scopes.getVisibleDepartmentIds(user) : null;
    }

    const isHr = this.scopes?.isHrActorAsync ? await this.scopes.isHrActorAsync(user) : false;
    if (isHr) {
      return this.scopes?.getVisibleDepartmentIds ? this.scopes.getVisibleDepartmentIds(user) : null;
    }

    // For Department Leaders / Chief Accountant: only departments they lead
    if (this.scopes?.getLedDepartmentIds) {
      const ledDeptIds = await this.scopes.getLedDepartmentIds(user);
      if (ledDeptIds.length > 0) {
        return ledDeptIds;
      }
    }

    // Fallback from explicit scopes
    const scopedDepts = user.scopes
      ?.filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      ?.map((scope) => scope.scopeId as string) || [];
    if (scopedDepts.length > 0) {
      return scopedDepts;
    }

    if (this.scopes?.getPrimaryDepartmentId) {
      try {
        const primaryId = await this.scopes.getPrimaryDepartmentId(user.userId);
        return primaryId ? [primaryId] : [];
      } catch {
        return [];
      }
    }

    return [];
  }
}

