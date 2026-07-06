import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AttendanceStatus, AttendanceVerificationType, RoleScopeType, UploadedFileStatus, UploadPurpose } from '@prisma/client';
import { BusinessTimeService } from '../time/business-time.service';
import { AttendanceService } from './attendance.service';

const actor = {
  sub: 'user-1',
  userId: 'user-1',
  roles: ['EMPLOYEE'],
  permissions: ['attendance.checkin'],
  scopes: [],
};

function attendanceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attendance-1',
    userId: 'user-1',
    departmentId: 'department-1',
    shiftAssignmentId: 'assignment-1',
    workDate: new Date('2026-07-05T00:00:00.000Z'),
    checkInAt: new Date('2026-07-05T01:00:00.000Z'),
    checkOutAt: null,
    status: AttendanceStatus.CHECKED_IN,
    checkInLatitude: null,
    checkInLongitude: null,
    checkOutLatitude: null,
    checkOutLongitude: null,
    photoFile: { id: 'file-1', fileUrl: '/uploads/attendance.jpg' },
    verifications: [{ type: AttendanceVerificationType.GPS, metadata: { attendanceLocationId: 'location-1' } }],
    adjustments: [],
    shiftAssignment: {
      id: 'assignment-1',
      shift: { id: 'shift-1', startTime: '08:00', endTime: '17:00', checkInEarlyMinutes: 15, checkInLateMinutes: 10 },
      department: { id: 'department-1' },
    },
    ...overrides,
  };
}

function setup() {
  const tx = {
    uploadedFile: { updateMany: jest.fn(async () => ({ count: 1 })) },
    attendanceRecord: {
      create: jest.fn(async () => attendanceRecord()),
      findUnique: jest.fn(async () => attendanceRecord()),
      updateMany: jest.fn(async () => ({ count: 1 })),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (txArg: typeof tx) => unknown) => callback(tx)),
    shiftAssignment: {
      findUnique: jest.fn(async () => ({
        id: 'assignment-1',
        userId: 'user-1',
        departmentId: 'department-1',
        shift: { isActive: true, deletedAt: null, startTime: '08:00', checkInEarlyMinutes: 1000000, checkInLateMinutes: 1000000 },
      })),
    },
    attendanceRecord: {
      findUnique: jest.fn(async () => null),
      findFirst: jest.fn(),
      findMany: jest.fn(async () => [attendanceRecord()]),
      count: jest.fn(async () => 1),
    },
    uploadedFile: {
      findUnique: jest.fn(async () => ({
        id: 'file-1',
        uploadedById: 'user-1',
        purpose: UploadPurpose.ATTENDANCE,
        status: UploadedFileStatus.TEMPORARY,
        deletedAt: null,
        fileUrl: '/uploads/attendance.jpg',
      })),
    },
    attendanceLocation: {
      findMany: jest.fn(async () => [{ id: 'location-1', latitude: 10, longitude: 106, radiusMeters: 100, name: 'HQ', departmentId: null }]),
      findUnique: jest.fn(async () => ({ id: 'location-1', name: 'HQ', latitude: 10, longitude: 106, radiusMeters: 100 })),
    },
    wifiConfig: { findMany: jest.fn(async () => []) },
    locationTracking: { create: jest.fn() },
    attendanceAdjustment: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };
  const scope = {
    visibleDepartmentIds: jest.fn(() => []),
    getPrimaryDepartmentId: jest.fn(async () => 'department-1'),
    canAccessDepartment: jest.fn(() => false),
    assertDepartmentAccess: jest.fn(),
  };
  const face = { verifyAttendanceFace: jest.fn(async () => ({ matched: true, confidence: 0.9, provider: 'test' })) };
  const service = new AttendanceService(prisma as never, scope as never, face as never, new BusinessTimeService());
  return { service, prisma, scope, face, tx };
}

describe('Attendance contract closure', () => {
  it('returns current attendance NONE for an employee without a record', async () => {
    const { service, prisma } = setup();
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    await expect(service.current(actor)).resolves.toEqual({ state: 'NONE', attendance: null });
  });

  it('returns current attendance CHECKED_IN', async () => {
    const { service, prisma } = setup();
    prisma.attendanceRecord.findFirst.mockResolvedValue(attendanceRecord());
    await expect(service.current(actor)).resolves.toMatchObject({ state: 'CHECKED_IN', attendance: { id: 'attendance-1' } });
  });

  it('returns current attendance CHECKED_OUT', async () => {
    const { service, prisma } = setup();
    prisma.attendanceRecord.findFirst.mockResolvedValue(attendanceRecord({ checkOutAt: new Date(), status: AttendanceStatus.CHECKED_OUT }));
    await expect(service.current(actor)).resolves.toMatchObject({ state: 'CHECKED_OUT' });
  });

  it('paginates employee own attendance history', async () => {
    const { service, prisma } = setup();
    await expect(service.myHistory(actor, { page: 1, limit: 20 })).resolves.toMatchObject({ pagination: { total: 1 } });
    expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }));
  });

  it('allows an employee to read own attendance detail', async () => {
    const { service, prisma } = setup();
    prisma.attendanceRecord.findUnique.mockResolvedValue(attendanceRecord());
    await expect(service.detail('attendance-1', actor)).resolves.toMatchObject({ id: 'attendance-1', workedMinutes: 0 });
  });

  it('denies another employee attendance detail', async () => {
    const { service, prisma } = setup();
    prisma.attendanceRecord.findUnique.mockResolvedValue(attendanceRecord({ userId: 'other-user' }));
    await expect(service.detail('attendance-1', actor)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows leader department-scoped attendance detail', async () => {
    const { service, prisma, scope } = setup();
    prisma.attendanceRecord.findUnique.mockResolvedValue(attendanceRecord({ userId: 'other-user' }));
    scope.canAccessDepartment.mockReturnValue(true);
    await expect(service.detail('attendance-1', { ...actor, permissions: ['attendance.read'], roles: ['LEADER'], scopes: [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: 'department-1' }] })).resolves.toMatchObject({ id: 'attendance-1' });
  });

  it('lists active attendance locations relevant to the employee', async () => {
    const { service, prisma } = setup();
    await expect(service.activeLocations(actor)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'location-1' })]));
    expect(prisma.attendanceLocation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isActive: true, deletedAt: null }) }));
  });

  it('accepts a valid temporary ATTENDANCE upload for check-in', async () => {
    const { service, tx } = setup();
    await expect(service.checkIn({ workDate: '2026-07-05', latitude: 10, longitude: 106, photoFileId: 'file-1' }, actor)).resolves.toMatchObject({ id: 'attendance-1' });
    expect(tx.uploadedFile.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'file-1', uploadedById: 'user-1' }) }));
  });

  it('denies an attendance photo uploaded by another user', async () => {
    const { service, prisma } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({ id: 'file-1', uploadedById: 'other-user', purpose: UploadPurpose.ATTENDANCE, status: UploadedFileStatus.TEMPORARY, deletedAt: null, fileUrl: '/x.jpg' });
    await expect(service.checkIn({ workDate: '2026-07-05', latitude: 10, longitude: 106, photoFileId: 'file-1' }, actor)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies an upload with the wrong purpose', async () => {
    const { service, prisma } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({ id: 'file-1', uploadedById: 'user-1', purpose: UploadPurpose.FACE_REGISTRATION, status: UploadedFileStatus.TEMPORARY, deletedAt: null, fileUrl: '/x.jpg' });
    await expect(service.checkIn({ workDate: '2026-07-05', latitude: 10, longitude: 106, photoFileId: 'file-1' }, actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('denies an already attached upload', async () => {
    const { service, prisma } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({ id: 'file-1', uploadedById: 'user-1', purpose: UploadPurpose.ATTENDANCE, status: UploadedFileStatus.ATTACHED, deletedAt: null, fileUrl: '/x.jpg' });
    await expect(service.checkIn({ workDate: '2026-07-05', latitude: 10, longitude: 106, photoFileId: 'file-1' }, actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('denies a deleted upload', async () => {
    const { service, prisma } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({ id: 'file-1', uploadedById: 'user-1', purpose: UploadPurpose.ATTENDANCE, status: UploadedFileStatus.TEMPORARY, deletedAt: new Date(), fileUrl: '/x.jpg' });
    await expect(service.checkIn({ workDate: '2026-07-05', latitude: 10, longitude: 106, photoFileId: 'file-1' }, actor)).rejects.toThrow();
  });
});
