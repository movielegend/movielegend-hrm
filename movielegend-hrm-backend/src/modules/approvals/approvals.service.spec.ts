import { ApprovalStatus, RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ApprovalPolicyService } from './approval-policy.service';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../../database/prisma.service';

describe('ApprovalsService approve', () => {
  it('creates department member inside approval transaction', async () => {
    const tx = {
      userApprovalRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'request-1',
          userId: 'employee-1',
          requestedDepartmentId: 'media',
          status: ApprovalStatus.PENDING,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      departmentMember: { upsert: jest.fn().mockResolvedValue({}) },
      approvalHistory: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      role: { findUnique: jest.fn().mockResolvedValue({ id: 'employee-role-id' }) },
      userRole: { 
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}) 
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new ApprovalsService(prisma, new ApprovalPolicyService());
    const actor: AuthenticatedUser = {
      sub: 'leader',
      userId: 'leader',
      roles: ['LEADER'],
      permissions: ['employee.approve'],
      scopes: [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: 'media' }],
    };

    await expect(service.approve('request-1', actor)).resolves.toEqual({
      id: 'request-1',
      status: ApprovalStatus.APPROVED,
    });
    expect(tx.departmentMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ departmentId: 'media', userId: 'employee-1' }),
      }),
    );
  });
});

describe('ApprovalsService findAll scope filtering', () => {
  it('returns no items when leader filters another department', async () => {
    const prisma = {
      userApprovalRequest: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    } as unknown as PrismaService;
    const service = new ApprovalsService(prisma, new ApprovalPolicyService());
    const actor: AuthenticatedUser = {
      sub: 'leader',
      userId: 'leader',
      roles: ['LEADER'],
      permissions: ['approval.read'],
      scopes: [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: 'media' }],
    };

    await service.findAll(actor, {
      departmentId: 'marketing',
      page: 1,
      limit: 20,
    });

    expect(prisma.userApprovalRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          requestedDepartmentId: { in: ['00000000-0000-0000-0000-000000000000'] },
        }),
      }),
    );
  });
});
