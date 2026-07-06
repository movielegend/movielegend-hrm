import { RoleScopeType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { FaceVerificationService } from '../face/services/face-verification.service';
import { DepartmentScopeService } from './department-scope.service';
import { LeaveService } from '../leave/leave.service';
import { ShiftAssignmentsService } from '../shift-assignments/shift-assignments.service';
import { ShiftsService } from '../shifts/shifts.service';

const admin: AuthenticatedUser = {
  sub: 'admin',
  userId: 'admin',
  roles: ['ADMIN'],
  permissions: [],
  scopes: [],
};

const mediaLeader: AuthenticatedUser = {
  sub: 'leader',
  userId: 'leader',
  roles: ['LEADER'],
  permissions: [],
  scopes: [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: 'media' }],
};

const employee: AuthenticatedUser = {
  sub: 'employee',
  userId: 'employee',
  roles: ['EMPLOYEE'],
  permissions: [],
  scopes: [],
};

describe('Phase 2 business flow', () => {
  it('allows Admin to create a shift', async () => {
    const prisma = {
      shift: { create: jest.fn().mockResolvedValue({ id: 'shift-1', code: 'HC' }) },
    } as unknown as PrismaService;
    const service = new ShiftsService(prisma);

    await expect(
      service.create({ code: 'HC', name: 'Hành chính', startTime: '08:00', endTime: '17:00' }),
    ).resolves.toEqual({ id: 'shift-1', code: 'HC' });
    expect(prisma.shift.create).toHaveBeenCalled();
  });

  it('allows Leader to assign an employee in own department', async () => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'employee', isActive: true, accountStatus: 'ACTIVE' }) },
      shift: { findUnique: jest.fn().mockResolvedValue({ id: 'shift-1', isActive: true, deletedAt: null }) },
      shiftAssignment: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'assignment-1' }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      departmentMember: { findFirst: jest.fn().mockResolvedValue({ userId: 'employee', departmentId: 'media' }) },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new ShiftAssignmentsService(prisma, new DepartmentScopeService(prisma));

    await expect(
      service.assign(
        { userId: 'employee', departmentId: 'media', shiftId: 'shift-1', workDate: '2026-07-04' },
        mediaLeader,
      ),
    ).resolves.toEqual({ id: 'assignment-1' });
  });

  it('denies Leader assigning another department', async () => {
    const prisma = {} as unknown as PrismaService;
    const service = new ShiftAssignmentsService(prisma, new DepartmentScopeService(prisma));

    await expect(
      service.assign(
        { userId: 'employee', departmentId: 'marketing', shiftId: 'shift-1', workDate: '2026-07-04' },
        mediaLeader,
      ),
    ).rejects.toMatchObject({ response: { code: 'FORBIDDEN_DEPARTMENT_SCOPE' } });
  });

  it('lets Employee view own schedule', async () => {
    const prisma = {
      shiftAssignment: { findMany: jest.fn().mockResolvedValue([{ id: 'assignment-1' }]) },
    } as unknown as PrismaService;
    const service = new ShiftAssignmentsService(prisma, new DepartmentScopeService(prisma));

    await expect(service.mySchedule(employee.userId)).resolves.toEqual([{ id: 'assignment-1' }]);
    expect(prisma.shiftAssignment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'employee' }) }));
  });

  it('allows check-in inside shift and GPS range', async () => {
    const now = new Date();
    const workDate = now.toISOString().slice(0, 10);
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tx = {
      attendanceRecord: { create: jest.fn().mockResolvedValue({ id: 'attendance-1' }) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      shiftAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'assignment-1',
          departmentId: 'media',
          shift: { startTime, checkInEarlyMinutes: 10080, checkInLateMinutes: 10080, isActive: true, deletedAt: null },
        }),
      },
      attendanceRecord: { findUnique: jest.fn().mockResolvedValue(null) },
      attendanceLocation: {
        findMany: jest.fn().mockResolvedValue([{ id: 'location-1', latitude: 10.0, longitude: 106.0, radiusMeters: 100 }]),
      },
      wifiConfig: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, new DepartmentScopeService(prisma), new FaceVerificationService());

    await expect(service.checkIn({ workDate, latitude: 10.0, longitude: 106.0, faceImage: 'legacy-face-image' }, employee)).resolves.toEqual({
      id: 'attendance-1',
    });
  });

  it('rejects check-in outside GPS range', async () => {
    const now = new Date();
    const workDate = now.toISOString().slice(0, 10);
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const prisma = {
      shiftAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'assignment-1',
          departmentId: 'media',
          shift: { startTime, checkInEarlyMinutes: 10080, checkInLateMinutes: 10080, isActive: true, deletedAt: null },
        }),
      },
      attendanceRecord: { findUnique: jest.fn().mockResolvedValue(null) },
      attendanceLocation: {
        findMany: jest.fn().mockResolvedValue([{ id: 'location-1', latitude: 10.0, longitude: 106.0, radiusMeters: 50 }]),
      },
      wifiConfig: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, new DepartmentScopeService(prisma), new FaceVerificationService());

    await expect(service.checkIn({ workDate, latitude: 11.0, longitude: 107.0, faceImage: 'legacy-face-image' }, employee)).rejects.toMatchObject({
      response: { code: 'OUTSIDE_ATTENDANCE_RADIUS' },
    });
  });

  it('prevents duplicate check-in for the same work date', async () => {
    const prisma = {
      shiftAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'assignment-1',
          departmentId: 'media',
          shift: { isActive: true, deletedAt: null },
        }),
      },
      attendanceRecord: { findUnique: jest.fn().mockResolvedValue({ id: 'attendance-1' }) },
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, new DepartmentScopeService(prisma), new FaceVerificationService());

    await expect(service.checkIn({ workDate: '2026-07-04', latitude: 10, longitude: 106, faceImage: 'legacy-face-image' }, employee)).rejects.toMatchObject({
      response: { code: 'ALREADY_CHECKED_IN' },
    });
  });

  it('denies check-in without assigned shift', async () => {
    const prisma = {
      shiftAssignment: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, new DepartmentScopeService(prisma), new FaceVerificationService());

    await expect(service.checkIn({ workDate: '2026-07-04', latitude: 10, longitude: 106, faceImage: 'legacy-face-image' }, employee)).rejects.toMatchObject({
      response: { code: 'SHIFT_ASSIGNMENT_NOT_FOUND' },
    });
  });

  it('checks out an open attendance record', async () => {
    const tx = {
      attendanceRecord: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({ id: 'attendance-1', checkOutAt: new Date() }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      attendanceRecord: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'attendance-1',
          userId: 'employee',
          checkInAt: new Date(Date.now() - 60_000),
          checkOutAt: null,
        }),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, new DepartmentScopeService(prisma), new FaceVerificationService());

    await expect(service.checkOut({ latitude: 10, longitude: 106 }, employee)).resolves.toEqual({
      id: 'attendance-1',
      checkOutAt: expect.any(Date),
    });
  });

  it('denies duplicate checkout', async () => {
    const prisma = {
      attendanceRecord: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'attendance-1',
          userId: 'employee',
          checkInAt: new Date(Date.now() - 60_000),
          checkOutAt: new Date(),
        }),
      },
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, new DepartmentScopeService(prisma), new FaceVerificationService());

    await expect(service.checkOut({ latitude: 10, longitude: 106 }, employee)).rejects.toMatchObject({
      response: { code: 'ALREADY_CHECKED_OUT' },
    });
  });

  it('creates leave request for employee primary department', async () => {
    const tx = {
      leaveRequest: { create: jest.fn().mockResolvedValue({ id: 'leave-1' }) },
      employeeRequest: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      departmentMember: { findFirst: jest.fn().mockResolvedValue({ departmentId: 'media' }) },
      leaveType: { findFirst: jest.fn().mockResolvedValue({ id: 'annual', isActive: true }) },
      leaveBalance: { findUnique: jest.fn().mockResolvedValue({ balanceDays: 12, usedDays: 0 }) },
      leaveRequest: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new LeaveService(prisma, new DepartmentScopeService(prisma));

    await expect(
      service.createLeaveRequest(
        { leaveTypeId: 'annual', startDate: '2026-07-04', endDate: '2026-07-05', reason: 'Nghỉ phép' },
        employee,
      ),
    ).resolves.toEqual({ id: 'leave-1' });
  });

  it('denies leave request with insufficient balance', async () => {
    const prisma = {
      departmentMember: { findFirst: jest.fn().mockResolvedValue({ departmentId: 'media' }) },
      leaveType: { findFirst: jest.fn().mockResolvedValue({ id: 'annual', isActive: true }) },
      leaveBalance: { findUnique: jest.fn().mockResolvedValue({ balanceDays: 1, usedDays: 0 }) },
    } as unknown as PrismaService;
    const service = new LeaveService(prisma, new DepartmentScopeService(prisma));

    await expect(
      service.createLeaveRequest(
        { leaveTypeId: 'annual', startDate: '2026-07-04', endDate: '2026-07-05', reason: 'Nghỉ phép' },
        employee,
      ),
    ).rejects.toMatchObject({ response: { code: 'LEAVE_BALANCE_INSUFFICIENT' } });
  });

  it('denies overlapping leave request', async () => {
    const prisma = {
      departmentMember: { findFirst: jest.fn().mockResolvedValue({ departmentId: 'media' }) },
      leaveType: { findFirst: jest.fn().mockResolvedValue({ id: 'annual', isActive: true }) },
      leaveBalance: { findUnique: jest.fn().mockResolvedValue({ balanceDays: 12, usedDays: 0 }) },
      leaveRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'leave-existing' }) },
    } as unknown as PrismaService;
    const service = new LeaveService(prisma, new DepartmentScopeService(prisma));

    await expect(
      service.createLeaveRequest(
        { leaveTypeId: 'annual', startDate: '2026-07-04', endDate: '2026-07-05', reason: 'Nghỉ phép' },
        employee,
      ),
    ).rejects.toMatchObject({ response: { code: 'LEAVE_REQUEST_OVERLAP' } });
  });

  it('allows Leader to approve only own department leave request', async () => {
    const tx = {
      leaveRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'leave-1',
          userId: 'employee',
          departmentId: 'media',
          leaveTypeId: 'annual',
          startDate: new Date('2026-07-04'),
          totalDays: 2,
          status: 'PENDING',
        }),
        update: jest.fn().mockResolvedValue({ id: 'leave-1', status: 'APPROVED' }),
      },
      leaveBalance: {
        findUnique: jest.fn().mockResolvedValue({ id: 'balance-1', balanceDays: 12, usedDays: 0 }),
        update: jest.fn().mockResolvedValue({}),
      },
      employeeRequest: { updateMany: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new LeaveService(prisma, new DepartmentScopeService(prisma));

    await expect(service.approveLeave('leave-1', mediaLeader)).resolves.toEqual({ id: 'leave-1', status: 'APPROVED' });
  });

  it('allows Admin to see all attendance records', async () => {
    const prisma = {
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([{ id: 'attendance-1' }]) },
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, new DepartmentScopeService(prisma), new FaceVerificationService());

    await expect(service.findAll(admin)).resolves.toEqual([{ id: 'attendance-1' }]);
    expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('denies overtime overlap', async () => {
    const prisma = {
      departmentMember: { findFirst: jest.fn().mockResolvedValue({ departmentId: 'media' }) },
      overtimeRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'ot-existing' }) },
    } as unknown as PrismaService;
    const service = new LeaveService(prisma, new DepartmentScopeService(prisma));

    await expect(
      service.createOvertimeRequest(
        {
          workDate: '2026-07-04',
          startAt: '2026-07-04T18:00:00.000Z',
          endAt: '2026-07-04T20:00:00.000Z',
          reason: 'OT',
        },
        employee,
      ),
    ).rejects.toMatchObject({ response: { code: 'OVERTIME_REQUEST_OVERLAP' } });
  });

  it('denies wrong leader scope for leave approval', async () => {
    const tx = {
      leaveRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'leave-1',
          userId: 'employee',
          departmentId: 'marketing',
          leaveTypeId: 'annual',
          startDate: new Date('2026-07-04'),
          totalDays: 1,
          status: 'PENDING',
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new LeaveService(prisma, new DepartmentScopeService(prisma));

    await expect(service.approveLeave('leave-1', mediaLeader)).rejects.toMatchObject({
      response: { code: 'FORBIDDEN_DEPARTMENT_SCOPE' },
    });
  });
});
