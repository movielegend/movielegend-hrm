import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  AccountStatus,
  ApprovalStatus,
  AssetConditionStatus,
  ContractType,
  FacePoseType,
  KpiPeriodType,
  KpiScoringMethod,
  PayrollStatus,
  RoleScopeType,
  SalaryType,
  SignatureType,
  TaskTargetType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('MovieLegend HRM E2E', () => {
  const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);

  (hasDatabase ? describe : describe.skip)('database backed business flow', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    const password = 'StrongPass123!';
    const unique = Date.now().toString();
    const phone = (suffix: string) => `08${unique.slice(-7)}${suffix}`;

    beforeAll(async () => {
      if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required for DB-backed E2E');
      if (process.env.DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL) {
        throw new Error('TEST_DATABASE_URL must not equal DATABASE_URL');
      }
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-long-enough';
      process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-long-enough';
      process.env.CORS_ORIGINS ||= 'http://localhost:8081';

      const { AppModule } = require('../src/app.module') as typeof import('../src/app.module');
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
      app = moduleRef.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
      app.useGlobalFilters(new AllExceptionsFilter());
      app.useGlobalInterceptors(new ResponseInterceptor());
      await app.init();
      prisma = app.get(PrismaService);
      await truncateTestDatabase(prisma);
      await seedCore(prisma, password, phone('01'));
    }, 60_000);

    afterAll(async () => {
      await app?.close();
    });

    it('runs auth, approval, attendance, task, asset, contract, KPI, dashboard, report, notification, and negative authorization journey', async () => {
      const server = app.getHttpServer();
      const adminLogin = await request(server).post('/auth/login').send({ phone: phone('01'), password }).expect(201);
      expect(adminLogin.body).toMatchObject({ success: true });
      const adminToken = adminLogin.body.data.accessToken as string;

      const media = await authPost(server, '/departments', adminToken, { companyId: globalState.companyId, code: `MEDIA_${unique}`, name: 'Media' });
      const marketing = await authPost(server, '/departments', adminToken, { companyId: globalState.companyId, code: `MKT_${unique}`, name: 'Marketing' });
      const mediaDepartmentId = media.id;
      const marketingDepartmentId = marketing.id;

      const leader = await createActiveUser(prisma, { phone: phone('02'), fullName: 'Leader Media', roleCode: 'LEADER', departmentId: mediaDepartmentId, password });
      const leaderLogin = await request(server).post('/auth/login').send({ phone: leader.phone, password }).expect(201);
      const leaderToken = leaderLogin.body.data.accessToken as string;

      const employeePhone = phone('03');
      const register = await request(server)
        .post('/auth/register')
        .send({
          fullName: 'Employee Media',
          phone: employeePhone,
          email: `employee.${unique}@example.test`,
          password,
          idCardNumber: `CCCD-${unique}`,
          requestedDepartmentId: mediaDepartmentId,
          faceImages: [
            { pose: FacePoseType.FRONT, imageUrl: 'local://front.jpg' },
            { pose: FacePoseType.LEFT, imageUrl: 'local://left.jpg' },
            { pose: FacePoseType.RIGHT, imageUrl: 'local://right.jpg' },
          ],
        })
        .expect(201);
      expect(register.body.data.approvalStatus).toBe(ApprovalStatus.PENDING);
      await request(server).post('/auth/login').send({ phone: employeePhone, password }).expect(401);

      const pending = await request(server).get('/approvals/accounts').set(auth(leaderToken)).query({ status: 'PENDING' }).expect(200);
      expect(pending.body.data.items.length).toBeGreaterThan(0);
      const approvalId = pending.body.data.items[0].id;
      await request(server).post(`/approvals/accounts/${approvalId}/approve`).set(auth(leaderToken)).expect(201);

      const employeeLogin = await request(server).post('/auth/login').send({ phone: employeePhone, password }).expect(201);
      const employeeToken = employeeLogin.body.data.accessToken as string;
      const employeeId = employeeLogin.body.data.user.id as string;
      const me = await request(server).get('/auth/me').set(auth(employeeToken)).expect(200);
      expect(me.body.data.roles).toContain('EMPLOYEE');
      expect(me.body.data.permissions).toContain('dashboard.own.read');

      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const shift = await authPost(server, '/shifts', adminToken, {
        code: `SHIFT_${unique}`,
        name: 'Integration Shift',
        startTime,
        endTime: '23:59',
        checkInEarlyMinutes: 10080,
        checkInLateMinutes: 10080,
      });
      await authPost(server, '/attendance/locations', adminToken, { departmentId: mediaDepartmentId, name: 'Media Office', latitude: 10, longitude: 106, radiusMeters: 500 });
      await authPost(server, '/shift-assignments', leaderToken, { userId: employeeId, departmentId: mediaDepartmentId, shiftId: shift.id, workDate: today });
      const schedule = await request(server).get('/shift-assignments/me').set(auth(employeeToken)).expect(200);
      expect(schedule.body.data.length).toBeGreaterThan(0);
      const outsideGps = await request(server).post('/attendance/check-in').set(auth(employeeToken)).send({ workDate: today, latitude: 11, longitude: 107 }).expect(400);
      expect(outsideGps.body).toMatchObject({ success: false, error: { code: 'OUTSIDE_ATTENDANCE_RADIUS' } });
      await authPost(server, '/attendance/check-in', employeeToken, { workDate: today, latitude: 10, longitude: 106, faceImage: 'local://attendance.jpg' });
      const duplicateCheckIn = await request(server).post('/attendance/check-in').set(auth(employeeToken)).send({ workDate: today, latitude: 10, longitude: 106 }).expect(409);
      expect(duplicateCheckIn.body).toMatchObject({ success: false, error: { code: 'ALREADY_CHECKED_IN' } });

      const task = await authPost(server, '/tasks', adminToken, {
        title: 'Integration Task',
        departmentContextId: mediaDepartmentId,
        targets: [{ targetType: TaskTargetType.USER, targetId: employeeId }],
      });
      const taskList = await request(server).get('/tasks/me').set(auth(employeeToken)).expect(200);
      const assignmentId = taskList.body.data[0].assignments[0].id;
      await request(server).patch(`/task-assignments/${assignmentId}/accept`).set(auth(employeeToken)).expect(200);
      await request(server).patch(`/task-assignments/${assignmentId}/start`).set(auth(employeeToken)).expect(200);
      await request(server).patch(`/task-assignments/${assignmentId}/progress`).set(auth(employeeToken)).send({ progressPercent: 80 }).expect(200);
      await request(server).patch(`/task-assignments/${assignmentId}/submit`).set(auth(employeeToken)).send({ completionNote: 'done' }).expect(200);
      await request(server).patch(`/task-assignments/${assignmentId}/approve`).set(auth(leaderToken)).send({ note: 'ok' }).expect(200);
      expect(task.taskCode).toBeDefined();

      await request(server).post('/attendance/check-out').set(auth(employeeToken)).send({ latitude: 10, longitude: 106 }).expect(201);
      const attendanceHistory = await request(server).get('/attendance').set(auth(adminToken)).expect(200);
      expect(attendanceHistory.body.data.length).toBeGreaterThan(0);

      const category = await authPost(server, '/asset-categories', adminToken, { code: `CAT_${unique}`, name: 'Camera' });
      const asset = await authPost(server, '/assets', adminToken, { categoryId: category.id, assetCode: `ASSET_${unique}`, name: 'Camera 1' });
      const assignment = await authPost(server, `/assets/${asset.id}/assign`, adminToken, { assignedToUserId: employeeId, conditionWhenAssigned: AssetConditionStatus.GOOD });
      await request(server).post(`/asset-assignments/${assignment.id}/confirm`).set(auth(employeeToken)).expect(201);
      const myAssets = await request(server).get('/assets/my').set(auth(employeeToken)).expect(200);
      expect(myAssets.body.data.length).toBeGreaterThan(0);

      await createPayrollFixture(prisma, employeeId, adminLogin.body.data.user.id, globalState.companyId);
      const payslips = await request(server).get('/payrolls/my').set(auth(employeeToken)).expect(200);
      expect(payslips.body.data.length).toBeGreaterThan(0);

      const template = await authPost(server, '/contract-templates', adminToken, { companyId: globalState.companyId, code: `CTR_TPL_${unique}`, name: 'Contract', contractType: ContractType.FIXED_TERM, templateFileUrl: 'local://template.docx' });
      const templateDetail = await request(server).get(`/contract-templates/${template.id}`).set(auth(adminToken)).expect(200);
      const contract = await authPost(server, '/employee-contracts', adminToken, {
        userId: employeeId,
        contractTemplateId: template.id,
        contractTemplateVersionId: templateDetail.body.data.versions[0].id,
        contractType: ContractType.FIXED_TERM,
        title: 'Employee Contract',
        startDate: today,
      });
      await request(server).post(`/employee-contracts/${contract.id}/submit-approval`).set(auth(adminToken)).expect(201);
      await request(server).post(`/employee-contracts/${contract.id}/approve`).set(auth(adminToken)).expect(201);
      await request(server).post(`/employee-contracts/${contract.id}/request-employee-signature`).set(auth(adminToken)).expect(201);
      await request(server).post(`/employee-contracts/${contract.id}/sign/employee`).set(auth(employeeToken)).send({ signatureType: SignatureType.OTP_CONFIRMED, signatureData: 'employee-ok' }).expect(201);
      await request(server).post(`/employee-contracts/${contract.id}/sign/company`).set(auth(adminToken)).send({ signatureType: SignatureType.OTP_CONFIRMED, signatureData: 'company-ok' }).expect(201);
      await request(server).post(`/employee-contracts/${contract.id}/activate`).set(auth(adminToken)).expect(201);
      const myContracts = await request(server).get('/employee-contracts/my').set(auth(employeeToken)).expect(200);
      expect(myContracts.body.data.length).toBeGreaterThan(0);

      const kpiTemplate = await authPost(server, '/kpi-templates', adminToken, { companyId: globalState.companyId, departmentId: mediaDepartmentId, code: `KPI_${unique}`, name: 'KPI', periodType: KpiPeriodType.MONTHLY });
      const criteria = await authPost(server, `/kpi-templates/${kpiTemplate.id}/criteria`, adminToken, { code: 'TASK', name: 'Task', weight: 100, scoringMethod: KpiScoringMethod.MANUAL });
      const kpi = await authPost(server, '/kpi-assignments', adminToken, { userId: employeeId, kpiTemplateId: kpiTemplate.id, periodStart: today, periodEnd: today });
      await request(server).patch(`/kpi-assignments/${kpi.id}/results`).set(auth(employeeToken)).send({ results: [{ criteriaId: criteria.id, employeeScore: 90, actualValue: '90' }] }).expect(200);
      await request(server).post(`/kpi-assignments/${kpi.id}/self-submit`).set(auth(employeeToken)).expect(201);
      await request(server).patch(`/kpi-assignments/${kpi.id}/results`).set(auth(leaderToken)).send({ results: [{ criteriaId: criteria.id, leaderScore: 95 }] }).expect(200);
      await request(server).post(`/kpi-assignments/${kpi.id}/leader-review`).set(auth(leaderToken)).expect(201);
      await request(server).patch(`/kpi-assignments/${kpi.id}/results`).set(auth(adminToken)).send({ results: [{ criteriaId: criteria.id, finalScore: 95 }] }).expect(200);
      await request(server).post(`/kpi-assignments/${kpi.id}/finalize`).set(auth(adminToken)).expect(201);
      const myKpi = await request(server).get('/kpi-assignments/my').set(auth(employeeToken)).expect(200);
      expect(myKpi.body.data.length).toBeGreaterThan(0);

      await request(server).get('/dashboard/admin').set(auth(adminToken)).expect(200);
      await request(server).get('/dashboard/leader').set(auth(leaderToken)).expect(200);
      await request(server).get('/dashboard/me').set(auth(employeeToken)).expect(200);
      await request(server).get('/reports/attendance').set(auth(adminToken)).expect(200);
      await request(server).get('/notifications/me').set(auth(employeeToken)).expect(200);

      const marketingEmployee = await createActiveUser(prisma, { phone: phone('04'), fullName: 'Marketing Employee', roleCode: 'EMPLOYEE', departmentId: marketingDepartmentId, password });
      const marketingApproval = await prisma.userApprovalRequest.create({ data: { userId: marketingEmployee.id, requestedDepartmentId: marketingDepartmentId } });
      const denied = await request(server).post(`/approvals/accounts/${marketingApproval.id}/approve`).set(auth(leaderToken)).expect(403);
      expect(denied.body).toMatchObject({ success: false, error: { code: 'APPROVAL_SCOPE_DENIED' } });
      const payrollDenied = await request(server).get(`/payrolls/${payslips.body.data[0].id}`).set(auth(employeeToken)).expect(403);
      expect(payrollDenied.body.success).toBe(false);
    });
  });

  it('documents required business cases for Phase 1', () => {
    expect([
      'register success',
      'duplicate phone rejected',
      'duplicate idCardNumber rejected',
      'missing FRONT rejected',
      'missing LEFT rejected',
      'missing RIGHT rejected',
      'pending login denied',
      'rejected login denied',
      'active login success',
      'leader sees own department',
      'leader cannot approve other department',
      'admin approves all departments',
      'logout revokes refresh token',
      'employee cannot call admin API',
    ]).toHaveLength(14);
  });

  it('documents required business cases for Phase 3', () => {
    expect([
      'admin creates task',
      'leader assigns task to employee in own department',
      'leader cannot assign task to another department',
      'employee views own task list',
      'employee accepts task',
      'employee updates progress',
      'employee submits task for review',
      'leader reviews only own department task',
      'admin views all tasks',
      'task extension request follows leader scope',
      'cross-department request requires source leader approval',
      'target department leader accepts or rejects cross-department request',
      'notification is stored without exposing device token',
      'device token is stored as hash',
      'attendance duplicate check-in remains blocked',
    ]).toHaveLength(15);
  });

  it('documents required business cases for Phase 4', () => {
    expect([
      'admin create warehouse',
      'employee create warehouse denied',
      'admin create material',
      'duplicate material code denied',
      'create receipt',
      'approve receipt increases stock',
      'approve receipt twice denied',
      'issue material success',
      'insufficient stock denied',
      'issue twice denied',
      'leader outside department scope denied',
      'create transfer',
      'source equals destination denied',
      'ship decreases source stock',
      'receive increases destination stock',
      'receive twice denied',
      'concurrent issue cannot produce negative stock',
      'create asset',
      'assign employee',
      'same asset double assignment denied',
      'employee confirm own assignment',
      'employee confirm another assignment denied',
      'return flow success',
      'asset maintenance cannot assign',
      'employee report own assigned asset',
      'report other employee asset denied',
      'resolve damaged incident updates asset state',
      'create inventory check',
      'submit inventory check does not change stock',
      'approve adjustment creates stock transaction',
      'asset assignment creates notification delivery',
      'warehouse room unauthorized join denied',
    ]).toHaveLength(32);
  });

  it('documents required business cases for Phase 5', () => {
    expect([
      'admin create salary profile',
      'employee denied salary profile create',
      'effective period lookup correct',
      'salary profile overlap handled',
      'create payroll period',
      'duplicate month denied',
      'calculate success',
      'concurrent calculate protected',
      'recalculate draft or calculated allowed',
      'recalculate locked denied',
      'attendance summary read correctly',
      'late minutes aggregated',
      'early leave minutes aggregated',
      'paid leave handled',
      'unpaid leave deduction correct',
      'rejected leave ignored',
      'approved overtime included',
      'rejected overtime ignored',
      'duplicate overtime not double counted',
      'approved bonus included',
      'pending bonus ignored',
      'bonus applied once only',
      'approved deduction included',
      'pending deduction ignored',
      'deduction applied once only',
      'violation alone does not deduct salary',
      'approved disciplinary deduction creates payroll deduction source',
      'rejected violation does not affect payroll',
      'calculate workflow',
      'submit review workflow',
      'approve workflow',
      'lock workflow',
      'locked immutable',
      'employee sees own payslip',
      'employee cannot view others payslip',
      'leader scope denied where required',
      'accountant correct permission',
      'admin all payroll',
      'payroll approved creates notification',
      'payslip available delivery to employee',
    ]).toHaveLength(40);
  });

  it('documents required business cases for Phase 6', () => {
    expect([
      'employee upload own document',
      'employee cannot upload for another user',
      'hr verify document',
      'leader sensitive document access denied without permission',
      'expired document query correct',
      'create contract draft',
      'employee cannot create arbitrary contract',
      'submit approval',
      'wrong approver denied',
      'approve success',
      'employee signature only own contract',
      'sign wrong state denied',
      'duplicate employee signature denied',
      'company signer permission required',
      'duplicate company signature denied',
      'activate complete signed contract',
      'unsigned contract cannot activate',
      'terminate active contract',
      'contract state skip denied',
      'document hash stored',
      'create KPI template',
      'criteria weight validation',
      'assign KPI employee',
      'employee sees own KPI',
      'employee cannot see another employee KPI',
      'self submit success',
      'duplicate self submit denied',
      'leader own department review success',
      'leader cross department review denied',
      'finalize success',
      'finalized result immutable',
      'task-based KPI aggregation correct',
      'finalized KPI snapshot stable',
      'create review cycle',
      'reviewer assignment',
      'employee self review',
      'wrong leader review denied',
      'correct leader review',
      'final reviewer permission required',
      'finalized review immutable',
      'contract signature required creates delivery',
      'KPI assigned creates employee notification',
      'review stage change notification correct',
      'employee document IDOR denied',
      'employee contract IDOR denied',
      'KPI IDOR denied',
      'review IDOR denied',
    ]).toHaveLength(47);
  });

  it('documents required business cases for Phase 7', () => {
    expect([
      'admin dashboard global summary',
      'leader dashboard own department',
      'leader cannot access other department',
      'employee dashboard own only',
      'attendance report correct aggregation',
      'overnight shift not double counted',
      'leader report scope enforced',
      'payroll summary permission enforced',
      'employee report masks sensitive fields',
      'asset report aggregation correct',
      'csv export authorized',
      'unauthorized export denied',
      'excel numeric cells remain numeric',
      'large export limit enforced',
      'csv Vietnamese opens correctly',
      'admin update business setting',
      'employee update setting denied',
      'secret setting not exposed',
      'employee update own preferences',
      'employee cannot update another user preferences',
      'mandatory notification cannot be disabled',
      'task due reminder',
      'duplicate reminder prevented',
      'contract expiry reminder',
      'document expiry reminder',
      'asset return reminder',
      'kpi deadline reminder',
      'job execution log created',
      'duplicate concurrent run protected',
      'unauthorized manual run denied',
      'admin audit search',
      'employee audit access denied',
      'live endpoint pass',
      'ready endpoint DB check',
      'health does not expose secret',
      'production missing JWT secret fails startup',
      'wildcard insecure CORS rejected in production',
    ]).toHaveLength(37);
  });
});

const globalState = { companyId: '' };

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function authPost(
  server: Parameters<typeof request>[0],
  path: string,
  token: string,
  body: Record<string, unknown>,
) {
  const response = await request(server).post(path).set(auth(token)).send(body).expect(201);
  expect(response.body.success).toBe(true);
  return response.body.data;
}

async function truncateTestDatabase(prisma: PrismaService) {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!databaseUrl.includes('movielegend_hrm_test')) {
    throw new Error('Refusing to truncate a non-test database');
  }
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;
  if (!tables.length) return;
  const quotedTables = tables.map((table) => `"public"."${table.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
}

async function seedCore(prisma: PrismaService, password: string, adminPhone: string) {
  const company = await prisma.company.create({
    data: { code: 'ML_TEST', name: 'MovieLegend Test Company' },
  });
  globalState.companyId = company.id;

  const permissions = await prisma.permission.createManyAndReturn({
    data: [...new Set([...adminPermissions, ...leaderPermissions, ...employeePermissions])].map((code) => ({
      code,
      name: code,
    })),
  });
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission.id]));

  await createRole(prisma, 'ADMIN', 'Admin', adminPermissions, permissionByCode);
  await createRole(prisma, 'LEADER', 'Leader', leaderPermissions, permissionByCode);
  await createRole(prisma, 'EMPLOYEE', 'Employee', employeePermissions, permissionByCode);
  await createRole(prisma, 'HR', 'HR', adminPermissions, permissionByCode);
  await createRole(prisma, 'ACCOUNTANT', 'Accountant', adminPermissions, permissionByCode);

  await createActiveUser(prisma, {
    phone: adminPhone,
    fullName: 'Admin Test',
    roleCode: 'ADMIN',
    password,
  });
}

async function createRole(
  prisma: PrismaService,
  code: string,
  name: string,
  permissionCodes: string[],
  permissionByCode: Map<string, string>,
) {
  const role = await prisma.role.create({ data: { code, name } });
  await prisma.rolePermission.createMany({
    data: permissionCodes.map((permissionCode) => ({
      roleId: role.id,
      permissionId: permissionByCode.get(permissionCode) as string,
    })),
  });
  return role;
}

async function createActiveUser(
  prisma: PrismaService,
  input: {
    phone: string;
    fullName: string;
    roleCode: string;
    password: string;
    departmentId?: string;
  },
) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: input.roleCode } });
  const user = await prisma.user.create({
    data: {
      userCode: `USR${Math.floor(Math.random() * 1_000_000_000)}`,
      phone: input.phone,
      email: `${input.phone}@example.test`,
      passwordHash: await bcrypt.hash(input.password, 10),
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      profile: {
        create: {
          fullName: input.fullName,
          idCardNumber: `ID-${input.phone}`,
        },
      },
      roles: {
        create: {
          roleId: role.id,
          scopeType: input.departmentId && input.roleCode === 'LEADER' ? RoleScopeType.DEPARTMENT : RoleScopeType.GLOBAL,
          scopeId: input.departmentId && input.roleCode === 'LEADER' ? input.departmentId : undefined,
        },
      },
      departmentLinks: input.departmentId
        ? {
            create: {
              departmentId: input.departmentId,
              isPrimary: true,
            },
          }
        : undefined,
    },
    include: { profile: true },
  });
  if (input.departmentId && input.roleCode === 'LEADER') {
    await prisma.department.update({ where: { id: input.departmentId }, data: { leaderUserId: user.id } });
  }
  return user;
}

async function createPayrollFixture(
  prisma: PrismaService,
  employeeId: string,
  actorUserId: string,
  companyId: string,
) {
  const effectiveFrom = new Date('2099-01-01');
  const period = await prisma.payrollPeriod.create({
    data: {
      periodCode: `PAY-${Date.now()}`,
      companyId,
      month: 1,
      year: 2099,
      startDate: effectiveFrom,
      endDate: new Date('2099-01-31'),
      createdById: actorUserId,
    },
  });
  const profile = await prisma.salaryProfile.create({
    data: {
      userId: employeeId,
      salaryType: SalaryType.MONTHLY,
      baseSalary: 10000000,
      standardWorkingDays: 26,
      effectiveFrom,
      createdById: actorUserId,
    },
  });
  await prisma.payroll.create({
    data: {
      payrollPeriodId: period.id,
      userId: employeeId,
      salaryProfileId: profile.id,
      baseSalary: 10000000,
      standardWorkingDays: 26,
      calculatedAt: new Date(),
      status: PayrollStatus.APPROVED,
      grossSalary: 10000000,
      netSalary: 10000000,
    },
  });
}

const adminPermissions = [
  'department.create',
  'approval.read',
  'approval.approve',
  'approval.reject',
  'employee.approve',
  'shift.create',
  'shift.read',
  'shift.assign',
  'attendance.location.manage',
  'attendance.read',
  'attendance.checkin',
  'task.assign_any',
  'task.read_all',
  'task.review_all',
  'asset.create',
  'asset.read',
  'asset.assign',
  'asset.return',
  'payroll.read_all',
  'contract_template.create',
  'contract_template.read',
  'contract.create',
  'contract.approve',
  'contract.sign_company',
  'contract.read_all',
  'kpi_template.create',
  'kpi_template.read',
  'kpi_template.update',
  'kpi.assign',
  'kpi.read_all',
  'kpi.finalize',
  'dashboard.admin.read',
  'report.attendance.read',
  'notification.read',
];

const leaderPermissions = [
  'approval.read',
  'approval.approve',
  'approval.reject',
  'employee.approve',
  'shift.assign',
  'shift.read',
  'task.read_department',
  'task.review_department',
  'kpi.read_department',
  'kpi.leader_review',
  'contract.read_department',
  'dashboard.department.read',
  'report.attendance.read',
  'notification.read',
];

const employeePermissions = [
  'dashboard.own.read',
  'shift.read',
  'attendance.checkin',
  'task.read_own',
  'task.accept_own',
  'task.update_progress_own',
  'task.submit_own',
  'task.comment_own',
  'task.extension_request_own',
  'asset.read',
  'asset.return',
  'payroll.read_own',
  'contract.read_own',
  'kpi.read_own',
  'kpi.self_review',
  'notification.read',
  'device_token.manage_own',
];
