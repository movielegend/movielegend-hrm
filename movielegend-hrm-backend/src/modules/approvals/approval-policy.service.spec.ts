import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ApprovalPolicyService } from './approval-policy.service';

describe('ApprovalPolicyService', () => {
  const service = new ApprovalPolicyService();

  it('allows admin globally', () => {
    const user: AuthenticatedUser = {
      sub: 'admin',
      userId: 'admin',
      roles: ['ADMIN'],
      permissions: [],
      scopes: [],
    };
    expect(service.canApproveDepartment(user, 'dept-a')).toBe(true);
    expect(service.visibleDepartmentIds(user)).toBeNull();
  });

  it('allows leader only for matching department scope', () => {
    const user: AuthenticatedUser = {
      sub: 'leader',
      userId: 'leader',
      roles: ['LEADER'],
      permissions: ['employee.approve'],
      scopes: [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: 'media' }],
    };
    expect(service.canApproveDepartment(user, 'media')).toBe(true);
    expect(service.canApproveDepartment(user, 'marketing')).toBe(false);
    expect(service.visibleDepartmentIds(user)).toEqual(['media']);
  });
});
