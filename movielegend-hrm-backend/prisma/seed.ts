import 'dotenv/config';
import { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const permissionCodes = [
  'user.read',
  'user.update',
  'user.manage',
  'employee.read',
  'employee.update',
  'employee.approve',
  'department.create',
  'department.read',
  'department.update',
  'department.delete',
  'position.create',
  'position.read',
  'position.update',
  'position.delete',
  'upload.create',
  'role.assign',
  'permission.read',
  'approval.read',
  'approval.approve',
  'approval.reject',
  'face.read',
  'face.approve',
  'shift.create',
  'shift.read',
  'shift.update',
  'shift.delete',
  'shift.assign',
  'shift.register',
  'shift.swap',
  'attendance.read',
  'attendance.checkin',
  'attendance.adjust',
  'attendance.location.manage',
  'leave.type.manage',
  'leave.balance.read',
  'leave.request',
  'leave.approve',
  'overtime.request',
  'overtime.approve',
  'employee.request',
  'employee.request.approve',
  'task.assign_any',
  'task.assign_department',
  'task.read_all',
  'task.read_department',
  'task.read_own',
  'task.review_all',
  'task.review_department',
  'task.accept_own',
  'task.update_progress_own',
  'task.submit_own',
  'task.comment_own',
  'task.extension_request_own',
  'task.extension_review_all',
  'task.extension_review_department',
  'task.group.manage_all',
  'task.group.manage_department',
  'cross_department.create',
  'cross_department.read_all',
  'cross_department.source_approve',
  'cross_department.target_receive',
  'notification.read',
  'device_token.manage_own',
  'warehouse.create',
  'warehouse.read',
  'warehouse.update',
  'warehouse.manage',
  'material.create',
  'material.read',
  'material.update',
  'stock.read',
  'stock.import',
  'stock.export',
  'stock.adjust',
  'stock.transfer',
  'material_issue.create',
  'material_issue.read',
  'material_issue.approve',
  'material_issue.issue',
  'asset.create',
  'asset.read',
  'asset.assign',
  'asset.return',
  'asset.transfer',
  'asset.incident.create',
  'asset.incident.read',
  'asset.incident.resolve',
  'asset.maintenance.manage',
  'inventory_check.create',
  'inventory_check.read',
  'inventory_check.submit',
  'inventory_check.approve',
  'salary_profile.create',
  'salary_profile.read',
  'salary_profile.update',
  'salary_component.create',
  'salary_component.read',
  'salary_component.update',
  'payroll_period.create',
  'payroll_period.read',
  'payroll.calculate',
  'payroll.review',
  'payroll.approve',
  'payroll.lock',
  'payroll.read_all',
  'payroll.read_own',
  'bonus.create',
  'bonus.read',
  'bonus.approve',
  'deduction.create',
  'deduction.read',
  'deduction.approve',
  'violation.create',
  'violation.read',
  'violation.confirm',
  'disciplinary_action.create',
  'disciplinary_action.approve',
  'employee_document.read_own',
  'employee_document.read_department',
  'employee_document.read_all',
  'employee_document.read_sensitive',
  'employee_document.create',
  'employee_document.verify',
  'contract_template.create',
  'contract_template.read',
  'contract_template.update',
  'contract.create',
  'contract.read_own',
  'contract.read_department',
  'contract.read_all',
  'contract.approve',
  'contract.sign_company',
  'contract.terminate',
  'kpi_template.create',
  'kpi_template.read',
  'kpi_template.update',
  'kpi.assign',
  'kpi.read_own',
  'kpi.read_department',
  'kpi.read_all',
  'kpi.self_review',
  'kpi.leader_review',
  'kpi.finalize',
  'review_cycle.create',
  'review_cycle.read',
  'review_cycle.manage',
  'performance_review.read_own',
  'performance_review.read_department',
  'performance_review.read_all',
  'performance_review.self_submit',
  'performance_review.leader_submit',
  'performance_review.finalize',
  'dashboard.admin.read',
  'dashboard.department.read',
  'dashboard.own.read',
  'report.employee.read',
  'report.attendance.read',
  'report.task.read',
  'report.payroll.summary',
  'report.payroll.detail',
  'report.warehouse.read',
  'report.asset.read',
  'report.kpi.read',
  'report.export.csv',
  'report.export.excel',
  'system_setting.read',
  'system_setting.update',
  'notification_preference.read_own',
  'notification_preference.update_own',
  'audit.read',
  'job.read',
  'job.run_manual',
  'feedback.create',
  'feedback.read_own',
  'feedback.read_all',
  'feedback.update_status',
];

async function main() {
  const company = await prisma.company.upsert({
    where: { code: 'MOVIE_LEGEND' },
    update: {},
    create: { code: 'MOVIE_LEGEND', name: 'Movie Legend' },
  });


  const permissions = await Promise.all(
    permissionCodes.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, name: code },
      }),
    ),
  );

  const admin = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: 'Admin' },
  });
  const leader = await prisma.role.upsert({
    where: { code: 'LEADER' },
    update: {},
    create: { code: 'LEADER', name: 'Leader' },
  });
  const employee = await prisma.role.upsert({
    where: { code: 'EMPLOYEE' },
    update: {},
    create: { code: 'EMPLOYEE', name: 'Employee' },
  });
  const warehouseManager = await prisma.role.upsert({
    where: { code: 'WAREHOUSE_MANAGER' },
    update: {},
    create: { code: 'WAREHOUSE_MANAGER', name: 'Warehouse Manager' },
  });
  const accountant = await prisma.role.upsert({
    where: { code: 'ACCOUNTANT' },
    update: {},
    create: { code: 'ACCOUNTANT', name: 'Accountant' },
  });
  const hr = await prisma.role.upsert({
    where: { code: 'HR' },
    update: {},
    create: { code: 'HR', name: 'Human Resources' },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin.id, permissionId: permission.id } },
      update: {},
      create: { roleId: admin.id, permissionId: permission.id },
    });
  }

  for (const code of [
    'user.read',
    'employee.read',
    'employee.approve',
    'department.read',
    'position.read',
    'upload.create',
    'approval.read',
    'approval.approve',
    'approval.reject',
    'face.read',
    'shift.read',
    'shift.assign',
    'attendance.read',
    'leave.balance.read',
    'leave.approve',
    'overtime.approve',
    'employee.request.approve',
    'task.assign_department',
    'task.read_department',
    'task.review_department',
    'task.extension_review_department',
    'task.group.manage_department',
    'cross_department.source_approve',
    'cross_department.target_receive',
    'notification.read',
    'device_token.manage_own',
    'material.read',
    'stock.read',
    'material_issue.create',
    'material_issue.read',
    'asset.read',
    'asset.incident.create',
    'inventory_check.read',
    'bonus.create',
    'bonus.read',
    'violation.create',
    'violation.read',
    'employee_document.read_department',
    'kpi.read_department',
    'kpi.leader_review',
    'performance_review.read_department',
    'performance_review.leader_submit',
    'dashboard.department.read',
    'report.employee.read',
    'report.attendance.read',
    'report.task.read',
    'report.asset.read',
    'report.kpi.read',
    'report.export.csv',
    'feedback.create',
    'feedback.read_own',
  ]) {
    const permission = permissions.find((item) => item.code === code);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: leader.id, permissionId: permission.id } },
        update: {},
        create: { roleId: leader.id, permissionId: permission.id },
      });
    }
  }

  for (const code of [
    'employee.read',
    'department.read',
    'position.read',
    'upload.create',
    'face.read',
    'shift.read',
    'shift.register',
    'shift.swap',
    'attendance.read',
    'attendance.checkin',
    'attendance.adjust',
    'leave.balance.read',
    'leave.request',
    'overtime.request',
    'employee.request',
    'task.read_own',
    'task.accept_own',
    'task.update_progress_own',
    'task.submit_own',
    'task.comment_own',
    'task.extension_request_own',
    'cross_department.create',
    'notification.read',
    'device_token.manage_own',
    'material.read',
    'material_issue.create',
    'material_issue.read',
    'asset.read',
    'asset.return',
    'asset.incident.create',
    'payroll.read_own',
    'employee_document.read_own',
    'employee_document.create',
    'contract.read_own',
    'kpi.read_own',
    'kpi.self_review',
    'performance_review.read_own',
    'performance_review.self_submit',
    'dashboard.own.read',
    'notification_preference.read_own',
    'notification_preference.update_own',
    'feedback.create',
    'feedback.read_own',
  ]) {
    const permission = permissions.find((item) => item.code === code);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: employee.id, permissionId: permission.id } },
        update: {},
        create: { roleId: employee.id, permissionId: permission.id },
      });
    }
  }

  for (const code of [
    'employee_document.read_own',
    'employee_document.read_department',
    'employee_document.read_all',
    'employee_document.read_sensitive',
    'employee_document.create',
    'position.read',
    'position.create',
    'position.update',
    'upload.create',
    'shift.read',
    'shift.create',
    'shift.update',
    'shift.assign',
    'employee_document.verify',
    'contract_template.create',
    'contract_template.read',
    'contract_template.update',
    'contract.create',
    'contract.read_own',
    'contract.read_department',
    'contract.read_all',
    'contract.approve',
    'contract.sign_company',
    'contract.terminate',
    'kpi_template.create',
    'kpi_template.read',
    'kpi_template.update',
    'kpi.assign',
    'kpi.read_own',
    'kpi.read_department',
    'kpi.read_all',
    'kpi.self_review',
    'kpi.leader_review',
    'kpi.finalize',
    'review_cycle.create',
    'review_cycle.read',
    'review_cycle.manage',
    'performance_review.read_own',
    'performance_review.read_department',
    'performance_review.read_all',
    'performance_review.self_submit',
    'performance_review.leader_submit',
    'performance_review.finalize',
    'dashboard.admin.read',
    'dashboard.department.read',
    'dashboard.own.read',
    'report.employee.read',
    'report.attendance.read',
    'report.task.read',
    'report.kpi.read',
    'report.export.csv',
    'report.export.excel',
    'system_setting.read',
    'system_setting.update',
    'audit.read',
    'job.read',
    'job.run_manual',
    'notification.read',
    'device_token.manage_own',
    'feedback.create',
    'feedback.read_own',
    'feedback.read_all',
    'feedback.update_status',
  ]) {
    const permission = permissions.find((item) => item.code === code);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: hr.id, permissionId: permission.id } },
        update: {},
        create: { roleId: hr.id, permissionId: permission.id },
      });
    }
  }

  for (const code of [
    'salary_profile.create',
    'salary_profile.read',
    'salary_profile.update',
    'salary_component.create',
    'salary_component.read',
    'salary_component.update',
    'payroll_period.create',
    'payroll_period.read',
    'payroll.calculate',
    'payroll.review',
    'payroll.approve',
    'payroll.lock',
    'payroll.read_all',
    'report.payroll.summary',
    'report.payroll.detail',
    'report.export.csv',
    'report.export.excel',
    'bonus.create',
    'bonus.read',
    'bonus.approve',
    'deduction.create',
    'deduction.read',
    'deduction.approve',
    'violation.read',
    'disciplinary_action.approve',
    'notification.read',
  ]) {
    const permission = permissions.find((item) => item.code === code);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: accountant.id, permissionId: permission.id } },
        update: {},
        create: { roleId: accountant.id, permissionId: permission.id },
      });
    }
  }

  for (const code of [
    'warehouse.read',
    'warehouse.update',
    'warehouse.manage',
    'material.read',
    'stock.read',
    'stock.import',
    'stock.export',
    'stock.adjust',
    'stock.transfer',
    'material_issue.read',
    'material_issue.approve',
    'material_issue.issue',
    'asset.read',
    'asset.assign',
    'asset.return',
    'asset.incident.read',
    'asset.incident.resolve',
    'asset.maintenance.manage',
    'inventory_check.create',
    'inventory_check.read',
    'inventory_check.submit',
    'inventory_check.approve',
    'dashboard.department.read',
    'report.warehouse.read',
    'report.asset.read',
    'report.export.csv',
    'report.export.excel',
    'notification.read',
    'device_token.manage_own',
  ]) {
    const permission = permissions.find((item) => item.code === code);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: warehouseManager.id, permissionId: permission.id } },
        update: {},
        create: { roleId: warehouseManager.id, permissionId: permission.id },
      });
    }
  }

  // Khởi tạo 2 Vùng Miền (Regions)
  const mienNam = await prisma.region.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MIEN_NAM' } },
    update: { name: 'Miền Nam', description: 'Khu vực Miền Nam (Tập trung Livestream bán hàng & CSKH)' },
    create: {
      companyId: company.id,
      code: 'MIEN_NAM',
      name: 'Miền Nam',
      description: 'Khu vực Miền Nam (Tập trung Livestream bán hàng & CSKH)',
    },
  });

  const mienBac = await prisma.region.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MIEN_BAC' } },
    update: { name: 'Miền Bắc', description: 'Khu vực Miền Bắc' },
    create: {
      companyId: company.id,
      code: 'MIEN_BAC',
      name: 'Miền Bắc',
      description: 'Khu vực Miền Bắc',
    },
  });

  // Khởi tạo 3 Chi nhánh trực thuộc Miền Nam
  const branchesData = [
    { code: 'CN_HO_CHI_MINH_1', name: 'Chi nhánh 1 (Quận 1)', address: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM' },
    { code: 'CN_HO_CHI_MINH_2', name: 'Chi nhánh 2 (Quận 7)', address: '456 Nguyễn Thị Thập, Tân Phú, Quận 7, TP.HCM' },
    { code: 'CN_HO_CHI_MINH_3', name: 'Chi nhánh 3 (Thủ Đức)', address: '789 Kha Vạn Cân, Linh Chiểu, TP. Thủ Đức, TP.HCM' },
  ];

  for (const b of branchesData) {
    const branch = await prisma.branch.upsert({
      where: { companyId_code: { companyId: company.id, code: b.code } },
      update: { regionId: mienNam.id, name: b.name, address: b.address },
      create: {
        companyId: company.id,
        regionId: mienNam.id,
        code: b.code,
        name: b.name,
        address: b.address,
        latitude: 10.776889,
        longitude: 106.700806,
        allowedRadius: 100,
      },
    });

    // Mỗi chi nhánh có 2 phòng ban cốt lõi: P. CSKH và P. Live
    await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: `${b.code}_CSKH` } },
      update: { branchId: branch.id, name: `Phòng CSKH - ${b.name}` },
      create: {
        companyId: company.id,
        branchId: branch.id,
        code: `${b.code}_CSKH`,
        name: `Phòng CSKH - ${b.name}`,
        description: 'Tư vấn, tiếp nhận và chăm sóc khách hàng mua máy chiếu',
      },
    });

    await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: `${b.code}_LIVE` } },
      update: { branchId: branch.id, name: `Phòng Live - ${b.name}` },
      create: {
        companyId: company.id,
        branchId: branch.id,
        code: `${b.code}_LIVE`,
        name: `Phòng Live - ${b.name}`,
        description: 'Đội ngũ Streamer, KOC thực hiện các ca live bán máy chiếu',
      },
    });
  }

  // Khởi tạo 3 Chi nhánh trực thuộc Miền Bắc (Đống Đa, Văn Chương, Long Biên)
  const mienBacBranchesData = [
    { code: 'CN_DONG_DA', name: 'Chi nhánh Đống Đa', address: 'Số 120 Tây Sơn, Phường Quang Trung, Quận Đống Đa, Hà Nội', lat: 21.0125, lng: 105.8286 },
    { code: 'CN_VAN_CHUONG', name: 'Chi nhánh Văn Chương', address: 'Số 68 Ngõ Văn Chương, Phường Văn Chương, Quận Đống Đa, Hà Nội', lat: 21.021, lng: 105.834 },
    { code: 'CN_LONG_BIEN', name: 'Chi nhánh Long Biên', address: 'Số 88 Nguyễn Văn Cừ, Phường Bồ Đề, Quận Long Biên, Hà Nội', lat: 21.042, lng: 105.875 },
  ];

  for (const b of mienBacBranchesData) {
    const branch = await prisma.branch.upsert({
      where: { companyId_code: { companyId: company.id, code: b.code } },
      update: { regionId: mienBac.id, name: b.name, address: b.address },
      create: {
        companyId: company.id,
        regionId: mienBac.id,
        code: b.code,
        name: b.name,
        address: b.address,
        latitude: b.lat,
        longitude: b.lng,
        allowedRadius: 100,
      },
    });

    await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: `${b.code}_CSKH` } },
      update: { branchId: branch.id, name: `Phòng CSKH - ${b.name}` },
      create: {
        companyId: company.id,
        branchId: branch.id,
        code: `${b.code}_CSKH`,
        name: `Phòng CSKH - ${b.name}`,
        description: 'Tư vấn, tiếp nhận và chăm sóc khách hàng mua máy chiếu tại ' + b.name,
      },
    });

    await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: `${b.code}_LIVE` } },
      update: { branchId: branch.id, name: `Phòng Live - ${b.name}` },
      create: {
        companyId: company.id,
        branchId: branch.id,
        code: `${b.code}_LIVE`,
        name: `Phòng Live - ${b.name}`,
        description: 'Đội ngũ Streamer, KOC thực hiện ca live tại ' + b.name,
      },
    });
  }

  // Khởi tạo các loại nghỉ phép mặc định
  const defaultLeaveTypes = [
    { code: 'PHEP_NAM', name: 'Nghỉ phép năm', annualQuotaDays: 12, isPaid: true },
    { code: 'NGHI_OM', name: 'Nghỉ ốm đau', annualQuotaDays: 30, isPaid: true },
    { code: 'VIEC_RIENG', name: 'Nghỉ việc riêng', annualQuotaDays: 5, isPaid: false },
  ];
  for (const dt of defaultLeaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: dt.code },
      update: { name: dt.name, annualQuotaDays: dt.annualQuotaDays, isPaid: dt.isPaid, isActive: true },
      create: { code: dt.code, name: dt.name, annualQuotaDays: dt.annualQuotaDays, isPaid: dt.isPaid, isActive: true },
    });
  }

  // Tạo Role HR phục vụ phân quyền nếu chưa có
  await prisma.role.upsert({
    where: { code: 'HR' },
    update: {},
    create: { code: 'HR', name: 'Nhân sự (HR)' },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@movielegend.vn';
  const adminPhone = process.env.SEED_ADMIN_PHONE || '0900000000';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
  const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      email: adminEmail,
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
    create: {
      userCode,
      phone: adminPhone,
      email: adminEmail,
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      profile: {
        create: {
          fullName: 'Admin Movie Legend',
          idCardNumber: `ADMIN-${Date.now()}`,
          employmentStatus: EmploymentStatus.OFFICIAL,
        },
      },
    },
  });

  const existingAdminRole = await prisma.userRole.findFirst({
    where: {
      userId: adminUser.id,
      roleId: admin.id,
      scopeType: RoleScopeType.GLOBAL,
      scopeId: null,
    },
  });
  if (!existingAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: admin.id,
        scopeType: RoleScopeType.GLOBAL,
      },
    });
  }

  // Khởi tạo tài khoản mẫu Admin Miền Bắc (0900000001) và Admin Miền Nam (0900000002)
  const regionalAdmins = [
    {
      phone: '0900000001',
      name: 'Admin Miền Bắc',
      email: 'admin.mienbac@movielegend.vn',
      regionId: mienBac.id,
      idPrefix: 'MB',
    },
    {
      phone: '0900000002',
      name: 'Admin Miền Nam',
      email: 'admin.miennam@movielegend.vn',
      regionId: mienNam.id,
      idPrefix: 'MN',
    },
  ];

  for (const regAdmin of regionalAdmins) {
    const pwdHash = await bcrypt.hash('admin123', 12);
    const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;

    const regUser = await prisma.user.upsert({
      where: { phone: regAdmin.phone },
      update: {
        email: regAdmin.email,
        passwordHash: pwdHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      },
      create: {
        companyId: company.id,
        userCode,
        phone: regAdmin.phone,
        email: regAdmin.email,
        passwordHash: pwdHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: regAdmin.name,
            idCardNumber: `ADMIN-${regAdmin.idPrefix}-${Date.now()}`,
            employmentStatus: EmploymentStatus.OFFICIAL,
          },
        },
      },
      include: { profile: true },
    });

    if (regUser.profile) {
      await prisma.employeeProfile.update({
        where: { userId: regUser.id },
        data: { fullName: regAdmin.name },
      });
    }

    await prisma.userRole.deleteMany({ where: { userId: regUser.id } });
    await prisma.userRole.create({
      data: {
        userId: regUser.id,
        roleId: admin.id,
        scopeType: RoleScopeType.REGION,
        scopeId: regAdmin.regionId,
      },
    });
  }

  // Khởi tạo các Positions mẫu
  const posHR = await prisma.position.upsert({
    where: { code: 'POS_HR' },
    update: {},
    create: { code: 'POS_HR', name: 'Chuyên viên Nhân sự' },
  });
  const posAccountant = await prisma.position.upsert({
    where: { code: 'POS_ACCOUNTANT' },
    update: {},
    create: { code: 'POS_ACCOUNTANT', name: 'Chuyên viên Kế toán' },
  });
  const posWarehouse = await prisma.position.upsert({
    where: { code: 'POS_WAREHOUSE' },
    update: {},
    create: { code: 'POS_WAREHOUSE', name: 'Thủ kho / Quản lý kho' },
  });
  const posLeaderCSKH = await prisma.position.upsert({
    where: { code: 'POS_LEADER_CSKH' },
    update: {},
    create: { code: 'POS_LEADER_CSKH', name: 'Trưởng phòng CSKH' },
  });
  const posStaffCSKH = await prisma.position.upsert({
    where: { code: 'POS_STAFF_CSKH' },
    update: {},
    create: { code: 'POS_STAFF_CSKH', name: 'Nhân viên CSKH' },
  });
  const posLeaderLive = await prisma.position.upsert({
    where: { code: 'POS_LEADER_LIVE' },
    update: {},
    create: { code: 'POS_LEADER_LIVE', name: 'Trưởng phòng Live' },
  });
  const posStaffLive = await prisma.position.upsert({
    where: { code: 'POS_STAFF_LIVE' },
    update: {},
    create: { code: 'POS_STAFF_LIVE', name: 'Streamer / KOC Live' },
  });

  // Lấy các phòng ban của Chi nhánh 1 để gán Leader và Nhân viên mẫu
  const deptCskhCn1 = await prisma.department.findUnique({
    where: { companyId_code: { companyId: company.id, code: 'CN_HO_CHI_MINH_1_CSKH' } },
  });
  const deptLiveCn1 = await prisma.department.findUnique({
    where: { companyId_code: { companyId: company.id, code: 'CN_HO_CHI_MINH_1_LIVE' } },
  });

  // Danh sách các tài khoản test cần tạo
  const testAccounts = [
    {
      phone: '0900000003',
      email: 'ketoan@movielegend.vn',
      fullName: 'Trần Văn Kế (Kế Toán)',
      roleId: accountant.id,
      scopeType: RoleScopeType.GLOBAL,
      scopeId: null,
      positionId: posAccountant.id,
      departmentId: null,
      isLeader: false,
    },
    {
      phone: '0900000004',
      email: 'kho@movielegend.vn',
      fullName: 'Phạm Minh Kho (Thủ Kho)',
      roleId: warehouseManager.id,
      scopeType: RoleScopeType.GLOBAL,
      scopeId: null,
      positionId: posWarehouse.id,
      departmentId: null,
      isLeader: false,
    },
    {
      phone: '0900000005',
      email: 'leader.cskh.cn1@movielegend.vn',
      fullName: 'Lê Hoàng Yến (Leader CSKH CN1)',
      roleId: leader.id,
      scopeType: RoleScopeType.DEPARTMENT,
      scopeId: deptCskhCn1?.id ?? null,
      positionId: posLeaderCSKH.id,
      departmentId: deptCskhCn1?.id ?? null,
      isLeader: true,
    },
    {
      phone: '0900000006',
      email: 'nhanvien.cskh1@movielegend.vn',
      fullName: 'Vũ Hải Đăng (Nhân viên CSKH CN1)',
      roleId: employee.id,
      scopeType: RoleScopeType.DEPARTMENT,
      scopeId: deptCskhCn1?.id ?? null,
      positionId: posStaffCSKH.id,
      departmentId: deptCskhCn1?.id ?? null,
      isLeader: false,
    },
    {
      phone: '0900000007',
      email: 'leader.live.cn1@movielegend.vn',
      fullName: 'Hoàng Minh Tuấn (Leader Live CN1)',
      roleId: leader.id,
      scopeType: RoleScopeType.DEPARTMENT,
      scopeId: deptLiveCn1?.id ?? null,
      positionId: posLeaderLive.id,
      departmentId: deptLiveCn1?.id ?? null,
      isLeader: true,
    },
    {
      phone: '0900000008',
      email: 'streamer.live1@movielegend.vn',
      fullName: 'Đặng Ngọc Ánh (Streamer / KOC Live CN1)',
      roleId: employee.id,
      scopeType: RoleScopeType.DEPARTMENT,
      scopeId: deptLiveCn1?.id ?? null,
      positionId: posStaffLive.id,
      departmentId: deptLiveCn1?.id ?? null,
      isLeader: false,
    },
  ];

  const commonPassword = 'admin123';
  const commonPasswordHash = await bcrypt.hash(commonPassword, 12);

  for (const acc of testAccounts) {
    const rowsUser = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const uCode = `NV${rowsUser[0].nextval.toString().padStart(6, '0')}`;

    const user = await prisma.user.upsert({
      where: { phone: acc.phone },
      update: {
        email: acc.email,
        passwordHash: commonPasswordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      },
      create: {
        userCode: uCode,
        phone: acc.phone,
        email: acc.email,
        passwordHash: commonPasswordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: acc.fullName,
            idCardNumber: `CCCD-${acc.phone}`,
            employmentStatus: EmploymentStatus.OFFICIAL,
            positionId: acc.positionId,
          },
        },
      },
    });

    // Cập nhật UserRole
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: acc.roleId,
      },
    });
    if (existingRole) {
      await prisma.userRole.update({
        where: { id: existingRole.id },
        data: {
          scopeType: acc.scopeType,
          scopeId: acc.scopeId,
        },
      });
    } else {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: acc.roleId,
          scopeType: acc.scopeType,
          scopeId: acc.scopeId,
        },
      });
    }

    // Nếu có departmentId -> Tạo DepartmentMember và gán Leader nếu có
    if (acc.departmentId) {
      await prisma.departmentMember.upsert({
        where: {
          departmentId_userId: {
            departmentId: acc.departmentId,
            userId: user.id,
          },
        },
        update: {
          positionId: acc.positionId,
          isPrimary: true,
          leftAt: null,
        },
        create: {
          departmentId: acc.departmentId,
          userId: user.id,
          positionId: acc.positionId,
          isPrimary: true,
        },
      });

      if (acc.isLeader) {
        await prisma.department.update({
          where: { id: acc.departmentId },
          data: { leaderUserId: user.id },
        });
      }
    }
  }

  console.log('Seeding completed. Full test accounts initialized successfully.');
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

