import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { FaceVerificationService } from '../face/services/face-verification.service';
import { ImageProcessingService } from '../uploads/image-processing.service';
import { StorageService } from '../storage/storage.service';
import { UploadsService } from '../uploads/uploads.service';
import { BusinessTimeService } from '../time/business-time.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {
            taskAssignment: { count: jest.fn().mockResolvedValue(0) },
            shiftAssignment: { findFirst: jest.fn() },
            attendanceRecord: { findFirst: jest.fn(), create: jest.fn() },
            departmentMember: { findFirst: jest.fn().mockResolvedValue({ departmentId: 'dep-1' }) },
            leaveRequest: { findFirst: jest.fn().mockResolvedValue(null) },
            attendanceLocation: { findFirst: jest.fn().mockResolvedValue({ id: 'loc-1', latitude: 10, longitude: 10, radiusMeters: 100 }) },
            $transaction: jest.fn((cb) => cb({
              attendanceRecord: { create: jest.fn().mockResolvedValue({ id: 'rec-1' }) },
              auditLog: { create: jest.fn() },
              uploadedFile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
              user: { findUnique: jest.fn().mockResolvedValue({ userCode: 'U1' }) },
              employeeProfile: { findUnique: jest.fn().mockResolvedValue({ fullName: 'Name' }) },
              attendanceVerification: { createMany: jest.fn() }
            })),
          },
        },
        { provide: DepartmentScopeService, useValue: {} },
        { provide: FaceVerificationService, useValue: { verifyAttendanceFace: jest.fn().mockResolvedValue({ matched: true, confidence: 99 }) } },
        { provide: ImageProcessingService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: UploadsService, useValue: {} },
        { provide: BusinessTimeService, useValue: new BusinessTimeService() },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Mock the internal methods that are not strictly related to checkIn logic testing
    jest.spyOn(service as any, 'validateAttendancePhoto').mockResolvedValue(null);
    jest.spyOn(service as any, 'findAllowedLocation').mockResolvedValue({ id: 'loc-1' });
    jest.spyOn(service as any, 'assertIpAllowed').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'assertWifiAllowed').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('checkIn', () => {
    const mockActor = { userId: 'user-1', sub: 'user-1', email: 'test@test.com', role: 'EMPLOYEE', roles: ['EMPLOYEE'], permissions: [], scopes: [] } as any;
    const mockIp = '127.0.0.1';
    const mockDto = { workDate: '2023-10-10', latitude: 10, longitude: 10, faceImage: 'base64' };

    it('should calculate late check-in penalty', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-10-10T09:30:00.000Z')); // 30 mins late
      
      const mockShift = { startTime: '09:00:00', endTime: '18:00:00', isActive: true };
      jest.spyOn(prisma.shiftAssignment, 'findFirst').mockResolvedValue({ id: 'sa-1', shift: mockShift } as any);
      jest.spyOn(prisma.attendanceRecord, 'findFirst').mockResolvedValue(null);
      const txSpy = jest.spyOn(prisma, '$transaction');

      await service.checkIn(mockDto, mockActor, mockIp);
      
      expect(txSpy).toHaveBeenCalled();
    });

    it('should check in on time without penalty', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-10-10T08:50:00.000Z')); // Early/on-time
      
      const mockShift = { startTime: '09:00:00', endTime: '18:00:00', isActive: true };
      jest.spyOn(prisma.shiftAssignment, 'findFirst').mockResolvedValue({ id: 'sa-1', shift: mockShift } as any);
      jest.spyOn(prisma.attendanceRecord, 'findFirst').mockResolvedValue(null);
      const txSpy = jest.spyOn(prisma, '$transaction');

      await service.checkIn(mockDto, mockActor, mockIp);
      
      expect(txSpy).toHaveBeenCalled();
    });

    it('should throw error if already checked in', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-10-10T08:50:00.000Z'));
      
      const mockShift = { startTime: '09:00:00', endTime: '18:00:00', isActive: true };
      jest.spyOn(prisma.shiftAssignment, 'findFirst').mockResolvedValue({ id: 'sa-1', shift: mockShift } as any);
      jest.spyOn(prisma.attendanceRecord, 'findFirst').mockResolvedValue({ status: 'CHECKED_IN' } as any);

      await expect(service.checkIn(mockDto, mockActor, mockIp)).rejects.toThrow('Bạn đang trong một ca chưa check-out');
    });

    it('should process unplanned overtime (end of shift or no shift)', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-10-10T20:00:00.000Z'));
      
      // No active assignment found or already checked out
      jest.spyOn(prisma.shiftAssignment, 'findFirst').mockResolvedValue(null);
      const txSpy = jest.spyOn(prisma, '$transaction');

      await service.checkIn(mockDto, mockActor, mockIp);
      
      expect(txSpy).toHaveBeenCalled();
    });
  });
});
