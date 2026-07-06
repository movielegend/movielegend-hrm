import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class ApprovalPolicyService {
  canApproveDepartment(user: AuthenticatedUser, departmentId: string): boolean {
    if (user.roles.includes('ADMIN')) return true;
    if (!user.permissions.includes('employee.approve')) return false;
    return user.scopes.some(
      (scope) =>
        scope.role === 'LEADER' &&
        scope.scopeType === RoleScopeType.DEPARTMENT &&
        scope.scopeId === departmentId,
    );
  }

  visibleDepartmentIds(user: AuthenticatedUser): string[] | null {
    if (user.roles.includes('ADMIN')) return null;
    return user.scopes
      .filter((scope) => scope.role === 'LEADER' && scope.scopeType === RoleScopeType.DEPARTMENT && scope.scopeId)
      .map((scope) => scope.scopeId as string);
  }
}
