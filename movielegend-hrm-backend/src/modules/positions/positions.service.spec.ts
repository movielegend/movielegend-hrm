import { ForbiddenException } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { PositionsService } from './positions.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('PositionsService', () => {
  const admin = actor(['ADMIN'], ['position.read', 'position.delete'], []);
  const leader = actor(['LEADER'], ['position.read'], [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: 'department-1' }]);

  function setup() {
    const prisma = {
      position: {
        findMany: jest.fn(async () => []),
        count: jest.fn(async () => 0),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      department: {
        findFirst: jest.fn(),
      },
      departmentMember: {
        findMany: jest.fn(async () => [{ departmentId: 'department-employee' }]),
        count: jest.fn(async () => 0),
      },
      employeeProfile: {
        count: jest.fn(async () => 0),
      },
      $transaction: jest.fn(async (items: Promise<number>[]) => Promise.all(items)),
    };
    const scope = new DepartmentScopeService(prisma as never);
    return { service: new PositionsService(prisma as never, scope), prisma };
  }

  it('filters position list by department for admin', async () => {
    const { service, prisma } = setup();
    await service.findAll(admin, { departmentId: 'department-1', page: 1, limit: 10 });
    expect(prisma.position.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ departmentId: 'department-1', deletedAt: null }),
      take: 10,
    }));
  });

  it('enforces leader department scope for position list', async () => {
    const { service } = setup();
    await expect(service.findAll(leader, { departmentId: 'department-2', page: 1, limit: 10 })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows leader to read positions in own department plus global metadata', async () => {
    const { service, prisma } = setup();
    await service.findAll(leader, { page: 1, limit: 10 });
    expect(prisma.position.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: [{ departmentId: null }, { departmentId: { in: ['department-1'] } }],
      }),
    }));
  });

  it('deactivates an in-use position instead of hard deleting it', async () => {
    const { service, prisma } = setup();
    prisma.position.findFirst.mockResolvedValue({ id: 'position-1', departmentId: 'department-1' });
    prisma.employeeProfile.count.mockResolvedValue(1);
    prisma.departmentMember.count.mockResolvedValue(0);
    prisma.position.update.mockResolvedValue({ id: 'position-1', isActive: false, deletedAt: null });

    await expect(service.remove(admin, 'position-1')).resolves.toMatchObject({ isActive: false, deletedAt: null });
    expect(prisma.position.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { isActive: false, deletedAt: null },
    }));
  });
});

function actor(
  roles: string[],
  permissions: string[],
  scopes: AuthenticatedUser['scopes'],
): AuthenticatedUser {
  return {
    sub: 'user-1',
    userId: 'user-1',
    roles,
    permissions,
    scopes,
  };
}
