import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../database/prisma.service';
import { PayrollPolicyService } from './payroll-policy.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { PayrollPeriodStatus } from '@prisma/client';

describe('PayrollService', () => {
  let service: PayrollService;
  let prisma: PrismaService;
  let policy: PayrollPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PrismaService,
          useValue: {
            payrollPeriod: { 
              findUnique: jest.fn(), 
              updateMany: jest.fn(),
              update: jest.fn()
            },
            user: { findMany: jest.fn(), findUnique: jest.fn() },
            department: { findUnique: jest.fn() },
            uploadedFile: { findFirst: jest.fn() },
            auditLog: { create: jest.fn(), findMany: jest.fn() },
            $transaction: jest.fn((cb) => cb({
              payroll: { upsert: jest.fn().mockResolvedValue({ id: 'p-1' }), findUnique: jest.fn().mockResolvedValue(null) },
              payrollItem: { createMany: jest.fn() },
              payrollCalculationSnapshot: { create: jest.fn(), deleteMany: jest.fn() },
              employeeBonus: { updateMany: jest.fn() },
              employeeDeduction: { updateMany: jest.fn() },
            })),
            salaryProfile: { findFirst: jest.fn() },
            employeeBonus: { findMany: jest.fn().mockResolvedValue([]) },
            employeeDeduction: { findMany: jest.fn().mockResolvedValue([]) },
            attendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
            leaveRequest: { findMany: jest.fn().mockResolvedValue([]) },
            overtimeRequest: { findMany: jest.fn().mockResolvedValue([]) },
            employeeSalaryComponent: { findMany: jest.fn().mockResolvedValue([]) },
          },
        },
        { 
          provide: PayrollPolicyService, 
          useValue: {
            dailySalary: jest.fn().mockReturnValue(100000),
            overtimeAmount: jest.fn().mockReturnValue(0),
          } 
        },
        { provide: NotificationsService, useValue: {} },
        { provide: RealtimeEventsService, useValue: { emitToRoom: jest.fn() } },
        { provide: require('../phase2-policy/department-scope.service').DepartmentScopeService, useValue: { isGlobalAdmin: jest.fn().mockReturnValue(true), getVisibleDepartmentIds: jest.fn().mockResolvedValue(null) } },
        { provide: require('../storage/storage.service').StorageService, useValue: { delete: jest.fn().mockResolvedValue(undefined), extractKeyFromUrl: jest.fn().mockReturnValue('test.png') } },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    prisma = module.get<PrismaService>(PrismaService);
    policy = module.get<PayrollPolicyService>(PayrollPolicyService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePeriod', () => {
    const mockActor = { userId: 'admin-1', sub: 'admin-1', email: 'admin@test.com', role: 'ADMIN', roles: ['ADMIN'], permissions: [], scopes: [] } as any;

    it('should throw if period not found', async () => {
      jest.spyOn(prisma.payrollPeriod, 'findUnique').mockResolvedValue(null);
      await expect(service.calculatePeriod('invalid', mockActor)).rejects.toThrow('Payroll period not found');
    });

    it('should throw if period locked', async () => {
      jest.spyOn(prisma.payrollPeriod, 'findUnique').mockResolvedValue({ status: PayrollPeriodStatus.LOCKED } as any);
      await expect(service.calculatePeriod('period-1', mockActor)).rejects.toThrow('Locked payroll cannot be recalculated');
    });

    it('should correctly process chunks of employees and update period status', async () => {
      jest.spyOn(prisma.payrollPeriod, 'findUnique').mockResolvedValue({ 
        id: 'period-1', 
        status: PayrollPeriodStatus.DRAFT,
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-10-31')
      } as any);
      jest.spyOn(prisma.payrollPeriod, 'updateMany').mockResolvedValue({ count: 1 } as any);
      
      const mockEmployees = Array.from({ length: 25 }, (_, i) => ({ id: `emp-${i}` }));
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockEmployees as any);
      
      const calculateEmployeeSpy = jest.spyOn(service as any, 'calculateEmployeePayroll').mockResolvedValue(undefined);
      jest.spyOn(prisma.payrollPeriod, 'update').mockResolvedValue({ status: PayrollPeriodStatus.CALCULATED } as any);

      await service.calculatePeriod('period-1', mockActor);

      expect(calculateEmployeeSpy).toHaveBeenCalledTimes(25);
      expect(prisma.payrollPeriod.update).toHaveBeenCalledWith({
        where: { id: 'period-1' },
        data: expect.objectContaining({ status: PayrollPeriodStatus.CALCULATED }),
      });
    });
  });

  describe('deleteDepartmentPayslipImage', () => {
    const mockActor = { userId: 'user-1', email: 'user@test.com', role: 'ADMIN', roles: ['ADMIN'], permissions: [], scopes: [] } as any;

    it('should successfully delete image from department batch and clear employee official image if assigned', async () => {
      (prisma as any).department = {
        findUnique: jest.fn().mockResolvedValue({ id: 'dept-1', name: 'Phòng IT' }),
      };
      (prisma as any).uploadedFile = {
        findFirst: jest.fn().mockResolvedValue({ storageKey: 'uploads/test.png' }),
      };

      const mockBatchImages = [
        { id: 'img-1', imageUrl: 'https://r2.dev/uploads/test.png', assignedUserId: 'emp-123' },
        { id: 'img-2', imageUrl: 'https://r2.dev/uploads/test2.png', assignedUserId: null },
      ];

      jest.spyOn(prisma.auditLog, 'findMany' as any).mockResolvedValue([
        {
          id: 'log-1',
          metadata: {
            month: 10,
            year: 2026,
            images: mockBatchImages,
          },
        },
      ] as any);

      const auditCreateSpy = jest.spyOn(prisma.auditLog, 'create' as any).mockResolvedValue({ id: 'log-new' } as any);

      const result = await service.deleteDepartmentPayslipImage(mockActor, {
        departmentId: 'dept-1',
        month: 10,
        year: 2026,
        imageId: 'img-1',
      });

      expect(result.success).toBe(true);
      expect(result.deletedImageId).toBe('img-1');
      expect(result.totalRemainingImages).toBe(1);
      // Verify official image cleared for emp-123
      expect(auditCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PAYROLL_OFFICIAL_IMAGE',
            entityId: 'emp-123',
            metadata: expect.objectContaining({ isDeleted: true, imageUrl: null }),
          }),
        })
      );
    });
  });

  describe('deleteOfficialImage', () => {
    const mockActor = { userId: 'user-1', email: 'user@test.com', role: 'ADMIN', roles: ['ADMIN'], permissions: [], scopes: [] } as any;

    it('should successfully delete official image for an employee', async () => {
      (prisma as any).user = {
        findUnique: jest.fn().mockResolvedValue({ id: 'emp-1', userCode: 'NV01', profile: { fullName: 'Nguyễn Văn A' } }),
      };
      (prisma as any).uploadedFile = {
        findFirst: jest.fn().mockResolvedValue({ storageKey: 'uploads/emp1.png' }),
      };

      jest.spyOn(prisma.auditLog, 'findMany' as any).mockResolvedValue([
        {
          id: 'log-1',
          metadata: { month: 10, year: 2026, imageUrl: 'https://r2.dev/uploads/emp1.png', isDeleted: false },
        },
      ] as any);

      const auditCreateSpy = jest.spyOn(prisma.auditLog, 'create' as any).mockResolvedValue({ id: 'log-new' } as any);

      const result = await service.deleteOfficialImage(mockActor, {
        userId: 'emp-1',
        month: 10,
        year: 2026,
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe('emp-1');
      expect(auditCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PAYROLL_OFFICIAL_IMAGE',
            entityId: 'emp-1',
            metadata: expect.objectContaining({ isDeleted: true, imageUrl: null }),
          }),
        })
      );
    });
  });
});
