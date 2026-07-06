import { BadRequestException } from '@nestjs/common';
import { EmployeeRequestStatus, EmployeeRequestType, LeaveRequestStatus, OvertimeRequestStatus, RoleScopeType } from '@prisma/client';
import { BusinessTimeService } from '../time/business-time.service';
import { EmployeeRequestsService } from '../employee-requests/employee-requests.service';
import { LeaveService } from './leave.service';

const actor = {
  sub: 'user-1',
  userId: 'user-1',
  roles: ['EMPLOYEE'],
  permissions: ['overtime.request'],
  scopes: [],
};

function setup() {
  const notificationPayload = { notification: { id: 'notification-1' }, userIds: ['user-1'] };
  const tx = {
    leaveRequest: {
      create: jest.fn(async () => ({ id: 'leave-1' })),
      update: jest.fn(async () => ({ id: 'leave-1', status: LeaveRequestStatus.REJECTED })),
    },
    employeeRequest: {
      create: jest.fn(async () => ({ id: 'er-1' })),
      updateMany: jest.fn(),
    },
    overtimeRequest: { update: jest.fn(async () => ({ id: 'ot-1', status: OvertimeRequestStatus.REJECTED })) },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (txArg: typeof tx) => unknown) => callback(tx)),
    leaveType: {
      create: jest.fn(),
      findMany: jest.fn(async () => [{ id: 'lt-1', isActive: true }]),
      findFirst: jest.fn(async () => ({ id: 'lt-1', isActive: true })),
    },
    leaveBalance: { findUnique: jest.fn(async () => ({ id: 'balance-1', balanceDays: 10, usedDays: 0 })) },
    leaveRequest: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => [{ id: 'leave-1', status: LeaveRequestStatus.PENDING }]),
      findUnique: jest.fn(async () => ({ id: 'leave-1', departmentId: 'department-1', status: LeaveRequestStatus.PENDING, userId: 'user-1', leaveTypeId: 'lt-1', startDate: new Date('2026-07-05'), totalDays: 1 })),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(async () => 1),
    },
    employeeRequest: {
      create: jest.fn(async () => ({ id: 'er-1' })),
      updateMany: jest.fn(),
    },
    overtimeRequest: {
      create: jest.fn(async () => ({ id: 'ot-1' })),
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => [{ id: 'ot-1', status: OvertimeRequestStatus.PENDING }]),
      findUnique: jest.fn(async () => ({ id: 'ot-1', userId: 'user-1', departmentId: 'department-1', status: OvertimeRequestStatus.PENDING })),
      update: jest.fn(async () => ({ id: 'ot-1', status: OvertimeRequestStatus.APPROVED })),
      count: jest.fn(async () => 1),
    },
  };
  const scope = {
    getPrimaryDepartmentId: jest.fn(async () => 'department-1'),
    assertDepartmentAccess: jest.fn(),
    visibleDepartmentIds: jest.fn(() => ['department-1']),
  };
  const notifications = {
    createForUsers: jest.fn(async () => notificationPayload),
    emitCreated: jest.fn(),
  };
  const service = new LeaveService(prisma as never, scope as never, notifications as never, new BusinessTimeService());
  return { service, prisma, scope, notifications, tx };
}

describe('Leave and overtime contract closure', () => {
  it('lists active leave types', async () => {
    const { service, prisma } = setup();
    await expect(service.findActiveLeaveTypes()).resolves.toEqual([{ id: 'lt-1', isActive: true }]);
    expect(prisma.leaveType.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true } }));
  });

  it('excludes inactive leave types through query criteria', async () => {
    const { service, prisma } = setup();
    await service.findActiveLeaveTypes();
    expect(prisma.leaveType.findMany.mock.calls[0]?.[0].where).toEqual({ isActive: true });
  });

  it('creates leave request only for an existing active leave type', async () => {
    const { service, prisma } = setup();
    await service.createLeaveRequest({ leaveTypeId: 'lt-1', startDate: '2026-07-05', endDate: '2026-07-05', reason: 'Family' }, actor);
    expect(prisma.leaveType.findFirst).toHaveBeenCalledWith({ where: { id: 'lt-1', isActive: true } });
  });

  it('lists employee own overtime history', async () => {
    const { service, prisma } = setup();
    await expect(service.findMyOvertimeRequests(actor, { page: 1, limit: 20 })).resolves.toMatchObject({ pagination: { total: 1 } });
    expect(prisma.overtimeRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }));
  });

  it('lists pending overtime within leader department scope', async () => {
    const { service, prisma } = setup();
    const leader = { ...actor, roles: ['LEADER'], permissions: ['overtime.approve'], scopes: [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: 'department-1' }] };
    await expect(service.findPendingOvertimeRequests(leader, { page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'ot-1' }] });
    expect(prisma.overtimeRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ departmentId: { in: ['department-1'] }, status: OvertimeRequestStatus.PENDING }) }));
  });

  it('rejects overtime with reason and notifies employee', async () => {
    const { service, notifications, tx } = setup();
    await expect(service.rejectOvertime('ot-1', { reason: 'No coverage' }, { ...actor, permissions: ['overtime.approve'] })).resolves.toMatchObject({ status: OvertimeRequestStatus.REJECTED });
    expect(tx.auditLog.create).toHaveBeenCalled();
    expect(notifications.emitCreated).toHaveBeenCalled();
  });

  it('denies rejecting overtime in an invalid state', async () => {
    const { service, prisma } = setup();
    prisma.overtimeRequest.findUnique.mockResolvedValue({ id: 'ot-1', userId: 'user-1', departmentId: 'department-1', status: OvertimeRequestStatus.APPROVED });
    await expect(service.rejectOvertime('ot-1', { reason: 'No coverage' }, { ...actor, permissions: ['overtime.approve'] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('denies approving overtime in an invalid state', async () => {
    const { service, prisma } = setup();
    prisma.overtimeRequest.findUnique.mockResolvedValue({ id: 'ot-1', userId: 'user-1', departmentId: 'department-1', status: OvertimeRequestStatus.REJECTED });
    await expect(service.approveOvertime('ot-1', { ...actor, permissions: ['overtime.approve'] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates overtime after overlap validation', async () => {
    const { service, prisma } = setup();
    await service.createOvertimeRequest({ workDate: '2026-07-05', startAt: '2026-07-05T11:00:00.000Z', endAt: '2026-07-05T13:00:00.000Z', reason: 'Release' }, actor);
    expect(prisma.overtimeRequest.findFirst).toHaveBeenCalled();
    expect(prisma.overtimeRequest.create).toHaveBeenCalled();
  });

  it('syncs leave reject with employee request status', async () => {
    const { service, tx } = setup();
    await service.rejectLeave('leave-1', { reason: 'No balance' }, { ...actor, permissions: ['leave.approve'] });
    expect(tx.employeeRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: EmployeeRequestStatus.REJECTED }) }));
  });
});

describe('Employee request own history contract', () => {
  it('uses own user id in employee request query', async () => {
    const prisma = {
      employeeRequest: {
        findMany: jest.fn(async () => [{ id: 'er-1', type: EmployeeRequestType.OTHER }]),
        count: jest.fn(async () => 1),
      },
    };
    const service = new EmployeeRequestsService(prisma as never, {} as never, new BusinessTimeService());
    await expect(service.findMine(actor, { page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'er-1' }], pagination: { total: 1 } });
    expect(prisma.employeeRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }));
  });

  it('filters own employee request history by type and status', async () => {
    const prisma = {
      employeeRequest: {
        findMany: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      },
    };
    const service = new EmployeeRequestsService(prisma as never, {} as never, new BusinessTimeService());
    await service.findMine(actor, { page: 1, limit: 20, type: EmployeeRequestType.OTHER, status: EmployeeRequestStatus.PENDING });
    expect(prisma.employeeRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1', type: EmployeeRequestType.OTHER, status: EmployeeRequestStatus.PENDING }) }));
  });
});
