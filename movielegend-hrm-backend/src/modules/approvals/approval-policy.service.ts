import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';

@Injectable()
export class ApprovalPolicyService {
  constructor(private readonly scopes: DepartmentScopeService) {}

  async canApproveDepartment(user: AuthenticatedUser, departmentId: string): Promise<boolean> {
    if (!user.permissions.includes('employee.approve') && !user.roles.includes('ADMIN')) return false;
    
    const visibleDepts = await this.scopes.getVisibleDepartmentIds(user);
    if (visibleDepts === null) return true;
    return visibleDepts.includes(departmentId);
  }

  async visibleDepartmentIds(user: AuthenticatedUser): Promise<string[] | null> {
    return this.scopes.getVisibleDepartmentIds(user);
  }
}
