import {
  AccountStatus,
  ApprovalStatus,
  AssetConditionStatus,
  AssetStatus,
  ContractStatus,
  ContractType,
  EmployeeKpiAssignmentStatus,
  EmploymentStatus,
  KpiPeriodType,
  KpiScoringMethod,
  PayrollPeriodStatus,
  PayrollStatus,
  RoleScopeType,
  SalaryType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/database/prisma.service';

const prisma = new PrismaService();

async function main() {
  const password = process.env.DEMO_DEFAULT_PASSWORD;
  if (!password) {
    console.warn('Skipping demo seed because DEMO_DEFAULT_PASSWORD is not set.');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const company = await prisma.company.upsert({
    where: { code: 'MOVIE_LEGEND' },
    update: {},
    create: { code: 'MOVIE_LEGEND', name: 'Movie Legend' },
  });
  const departmentNames = ['HCNS', 'Marketing', 'Media', 'Ky thuat', 'Kho', 'Ke toan', 'CSKH', 'Live', 'Bao ve'];
  const departments = await Promise.all(
    departmentNames.map((name) =>
      prisma.department.upsert({
        where: { companyId_code: { companyId: company.id, code: name.toUpperCase().replace(/\s+/g, '_') } },
        update: {},
        create: { companyId: company.id, code: name.toUpperCase().replace(/\s+/g, '_'), name },
      }),
    ),
  );
  const roles = await prisma.role.findMany({ where: { code: { in: ['ADMIN', 'HR', 'ACCOUNTANT', 'WAREHOUSE_MANAGER', 'LEADER', 'EMPLOYEE'] } } });
  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const users = [
    ['demo.admin@movielegend.local', '0900000001', 'Demo Admin', 'ADMIN', departments[0].id],
    ['demo.hr@movielegend.local', '0900000002', 'Demo HR', 'HR', departments[0].id],
    ['demo.accountant@movielegend.local', '0900000003', 'Demo Accountant', 'ACCOUNTANT', departments[5].id],
    ['demo.warehouse@movielegend.local', '0900000004', 'Demo Warehouse Manager', 'WAREHOUSE_MANAGER', departments[4].id],
    ['demo.leader.media@movielegend.local', '0900000005', 'Demo Media Leader', 'LEADER', departments[2].id],
    ['demo.leader.marketing@movielegend.local', '0900000006', 'Demo Marketing Leader', 'LEADER', departments[1].id],
    ['demo.leader.live@movielegend.local', '0900000007', 'Demo Live Leader', 'LEADER', departments[7].id],
    ['demo.employee1@movielegend.local', '0900000008', 'Demo Employee 1', 'EMPLOYEE', departments[2].id],
    ['demo.employee2@movielegend.local', '0900000009', 'Demo Employee 2', 'EMPLOYEE', departments[2].id],
    ['demo.employee3@movielegend.local', '0900000010', 'Demo Employee 3', 'EMPLOYEE', departments[1].id],
    ['demo.employee4@movielegend.local', '0900000011', 'Demo Employee 4', 'EMPLOYEE', departments[7].id],
    ['demo.employee5@movielegend.local', '0900000012', 'Demo Employee 5', 'EMPLOYEE', departments[4].id],
    ['demo.employee6@movielegend.local', '0900000013', 'Demo Employee 6', 'EMPLOYEE', departments[5].id],
  ] as const;

  for (const [email, phone, fullName, roleCode, departmentId] of users) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    const userCode = existing?.userCode ?? await prisma.nextUserCode(prisma);
    const user = await prisma.user.upsert({
      where: { phone },
      update: { email, passwordHash, accountStatus: AccountStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED, isActive: true },
      create: {
        userCode,
        phone,
        email,
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: { create: { fullName, idCardNumber: `DEMO-${phone}`, employmentStatus: EmploymentStatus.OFFICIAL, joinDate: new Date() } },
      },
    });
    const role = roleByCode.get(roleCode);
    if (role) {
      const scopeType = roleCode === 'LEADER' ? RoleScopeType.DEPARTMENT : RoleScopeType.GLOBAL;
      const scopeId = roleCode === 'LEADER' ? departmentId : null;
      const existingRole = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: role.id, scopeType, scopeId },
      });
      if (!existingRole) await prisma.userRole.create({ data: { userId: user.id, roleId: role.id, scopeType, scopeId } });
    }
    await prisma.departmentMember.upsert({
      where: { departmentId_userId: { departmentId, userId: user.id } },
      update: { leftAt: null },
      create: { departmentId, userId: user.id, isPrimary: true },
    });
  }

  const shift = await prisma.shift.upsert({
    where: { code: 'DEMO_DAY' },
    update: {},
    create: { code: 'DEMO_DAY', name: 'Demo Day Shift', startTime: '08:00', endTime: '17:00', checkInEarlyMinutes: 30, checkInLateMinutes: 30 },
  });
  const employee = await prisma.user.findUniqueOrThrow({ where: { phone: '0900000008' } });
  const workDate = new Date();
  workDate.setHours(0, 0, 0, 0);
  await prisma.shiftAssignment.upsert({
    where: { userId_workDate: { userId: employee.id, workDate } },
    update: {},
    create: { userId: employee.id, shiftId: shift.id, departmentId: departments[2].id, workDate, assignedByUserId: employee.id },
  });
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'DEMO_KHO' },
    update: {},
    create: { companyId: company.id, code: 'DEMO_KHO', name: 'Demo Kho', managerUserId: employee.id },
  });
  const category = await prisma.assetCategory.upsert({ where: { code: 'DEMO_DEVICE' }, update: {}, create: { code: 'DEMO_DEVICE', name: 'Demo Device' } });
  await prisma.asset.upsert({
    where: { assetCode: 'DEMO_ASSET_001' },
    update: {},
    create: { assetCode: 'DEMO_ASSET_001', categoryId: category.id, warehouseId: warehouse.id, name: 'Demo Camera', conditionStatus: AssetConditionStatus.GOOD, assetStatus: AssetStatus.IN_STOCK },
  });
  const salaryProfile = await prisma.salaryProfile.findFirst({ where: { userId: employee.id } }) ?? await prisma.salaryProfile.create({
    data: { userId: employee.id, salaryType: SalaryType.MONTHLY, baseSalary: 10000000, standardWorkingDays: 26, effectiveFrom: workDate, createdById: employee.id },
  });
  const period = await prisma.payrollPeriod.upsert({
    where: { companyId_month_year: { companyId: company.id, month: workDate.getMonth() + 1, year: workDate.getFullYear() } },
    update: {},
    create: { periodCode: `DEMO-${workDate.getFullYear()}-${workDate.getMonth() + 1}`, companyId: company.id, month: workDate.getMonth() + 1, year: workDate.getFullYear(), startDate: workDate, endDate: workDate, createdById: employee.id, status: PayrollPeriodStatus.CALCULATED },
  });
  await prisma.payroll.upsert({
    where: { payrollPeriodId_userId: { payrollPeriodId: period.id, userId: employee.id } },
    update: {},
    create: { payrollPeriodId: period.id, userId: employee.id, salaryProfileId: salaryProfile.id, baseSalary: 10000000, standardWorkingDays: 26, calculatedAt: new Date(), status: PayrollStatus.CALCULATED },
  });
  const template = await prisma.contractTemplate.upsert({
    where: { companyId_code: { companyId: company.id, code: 'DEMO_CONTRACT' } },
    update: {},
    create: { companyId: company.id, code: 'DEMO_CONTRACT', name: 'Demo Contract', contractType: ContractType.FIXED_TERM, templateFileUrl: 'local://demo-contract.docx', createdById: employee.id },
  });
  const version = await prisma.contractTemplateVersion.upsert({
    where: { contractTemplateId_versionNumber: { contractTemplateId: template.id, versionNumber: 1 } },
    update: {},
    create: { contractTemplateId: template.id, versionNumber: 1, templateFileUrl: template.templateFileUrl, createdById: employee.id },
  });
  await prisma.employeeContract.upsert({
    where: { contractCode: 'DEMO-CTR-001' },
    update: {},
    create: { contractCode: 'DEMO-CTR-001', userId: employee.id, contractTemplateId: template.id, contractTemplateVersionId: version.id, contractType: ContractType.FIXED_TERM, title: 'Demo Employee Contract', startDate: workDate, status: ContractStatus.ACTIVE, createdById: employee.id },
  });
  const kpiTemplate = await prisma.kpiTemplate.upsert({
    where: { companyId_code: { companyId: company.id, code: 'DEMO_KPI' } },
    update: {},
    create: { companyId: company.id, departmentId: departments[2].id, code: 'DEMO_KPI', name: 'Demo KPI', periodType: KpiPeriodType.MONTHLY, createdById: employee.id },
  });
  const criteria = await prisma.kpiCriteria.upsert({
    where: { kpiTemplateId_code: { kpiTemplateId: kpiTemplate.id, code: 'TASK_DONE' } },
    update: {},
    create: { kpiTemplateId: kpiTemplate.id, code: 'TASK_DONE', name: 'Task completion', weight: 100, scoringMethod: KpiScoringMethod.MANUAL },
  });
  const assignment = await prisma.employeeKpiAssignment.upsert({
    where: { userId_kpiTemplateId_periodStart_periodEnd: { userId: employee.id, kpiTemplateId: kpiTemplate.id, periodStart: workDate, periodEnd: workDate } },
    update: {},
    create: { userId: employee.id, kpiTemplateId: kpiTemplate.id, periodStart: workDate, periodEnd: workDate, status: EmployeeKpiAssignmentStatus.ACTIVE, assignedById: employee.id },
  });
  await prisma.employeeKpiResult.upsert({
    where: { employeeKpiAssignmentId_criteriaId: { employeeKpiAssignmentId: assignment.id, criteriaId: criteria.id } },
    update: {},
    create: { employeeKpiAssignmentId: assignment.id, criteriaId: criteria.id, targetValue: '100' },
  });
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
