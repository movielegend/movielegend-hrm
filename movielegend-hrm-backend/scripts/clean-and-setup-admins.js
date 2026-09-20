const { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType } = require('@prisma/client');
const bcrypt = require('bcrypt');

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
  console.log('================================================================');
  console.log('  🚀 BẮT ĐẦU DỌN DẸP SẠCH CSDL & THIẾT LẬP 3 ADMIN');
  console.log('================================================================\n');

  // 1. TRUNCATE CASCADE TOÀN BỘ CÁC BẢNG PUBLIC (TRỪ BẢNG MIGRATION)
  console.log('--> [1/6] Đang xóa sạch toàn bộ dữ liệu bảng nghiệp vụ cũ (TRUNCATE CASCADE)...');
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `);
    if (tables && tables.length > 0) {
      const tableList = tables.map(t => `"${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE;`);
      console.log(`    Đã dọn sạch ${tables.length} bảng dữ liệu.`);
    }
  } catch (e) {
    console.log('    Lưu ý khi truncate:', e.message);
  }

  // 2. TẠO COMPANY
  console.log('--> [2/6] Thiết lập Doanh nghiệp (Company)...');
  const company = await prisma.company.create({
    data: { code: 'MOVIE_LEGEND', name: 'Movie Legend' },
  });

  // 3. TẠO 2 VÙNG MIỀN (MIỀN BẮC, MIỀN NAM)
  console.log('--> [3/6] Thiết lập 2 Vùng Miền (Miền Bắc & Miền Nam)...');
  const mienBac = await prisma.region.create({
    data: {
      companyId: company.id,
      code: 'MIEN_BAC',
      name: 'Miền Bắc',
      description: 'Khu vực Miền Bắc',
    },
  });

  const mienNam = await prisma.region.create({
    data: {
      companyId: company.id,
      code: 'MIEN_NAM',
      name: 'Miền Nam',
      description: 'Khu vực Miền Nam',
    },
  });

  // 4. TẠO BẢNG PHÂN QUYỀN (ROLES, PERMISSIONS, ROLE_PERMISSIONS)
  console.log('--> [4/6] Thiết lập Bảng Phân Quyền Hệ Thống (RBAC)...');
  const permissions = [];
  for (const code of permissionCodes) {
    const perm = await prisma.permission.create({
      data: { code, name: code },
    });
    permissions.push(perm);
  }

  const adminRole = await prisma.role.create({
    data: { code: 'ADMIN', name: 'Admin' },
  });
  const leaderRole = await prisma.role.create({
    data: { code: 'LEADER', name: 'Leader' },
  });
  const employeeRole = await prisma.role.create({
    data: { code: 'EMPLOYEE', name: 'Employee' },
  });
  const hrRole = await prisma.role.create({
    data: { code: 'HR', name: 'Nhân sự (HR)' },
  });
  const accountantRole = await prisma.role.create({
    data: { code: 'ACCOUNTANT', name: 'Accountant' },
  });
  const warehouseRole = await prisma.role.create({
    data: { code: 'WAREHOUSE_MANAGER', name: 'Warehouse Manager' },
  });

  // Gán tất cả quyền cho Admin
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  // Cài đặt Loại nghỉ phép mặc định
  const defaultLeaveTypes = [
    { code: 'PHEP_NAM', name: 'Nghỉ phép năm', annualQuotaDays: 12, isPaid: true },
    { code: 'NGHI_OM', name: 'Nghỉ ốm đau', annualQuotaDays: 30, isPaid: true },
    { code: 'VIEC_RIENG', name: 'Nghỉ việc riêng', annualQuotaDays: 5, isPaid: false },
  ];
  for (const dt of defaultLeaveTypes) {
    await prisma.leaveType.create({
      data: { code: dt.code, name: dt.name, annualQuotaDays: dt.annualQuotaDays, isPaid: dt.isPaid, isActive: true },
    });
  }

  // 5. TẠO 3 TÀI KHOẢN ADMIN (NV000001, NV000002, NV000003)
  console.log('--> [5/6] Khởi tạo 3 tài khoản Quản trị viên (NV000001, NV000002, NV000003)...');
  const passwordHash = await bcrypt.hash('admin123', 12);

  // 5.1 Super Admin (NV000001)
  const adminUser = await prisma.user.create({
    data: {
      userCode: 'NV000001',
      phone: '0900000000',
      email: 'admin@movielegend.vn',
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      profile: {
        create: {
          fullName: 'Admin Movie Legend',
          idCardNumber: 'ADMIN-GLOBAL',
          employmentStatus: EmploymentStatus.OFFICIAL,
        },
      },
    },
  });

  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
      scopeType: RoleScopeType.GLOBAL,
    },
  });

  // 5.2 Admin Miền Bắc (NV000002)
  const adminMienBac = await prisma.user.create({
    data: {
      userCode: 'NV000002',
      phone: '0900000001',
      email: 'admin.mienbac@movielegend.vn',
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      profile: {
        create: {
          fullName: 'Admin Miền Bắc',
          idCardNumber: 'ADMIN-MB',
          employmentStatus: EmploymentStatus.OFFICIAL,
        },
      },
    },
  });

  await prisma.userRole.create({
    data: {
      userId: adminMienBac.id,
      roleId: adminRole.id,
      scopeType: RoleScopeType.REGION,
      scopeId: mienBac.id,
    },
  });

  // 5.3 Admin Miền Nam (NV000003)
  const adminMienNam = await prisma.user.create({
    data: {
      userCode: 'NV000003',
      phone: '0900000002',
      email: 'admin.miennam@movielegend.vn',
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      profile: {
        create: {
          fullName: 'Admin Miền Nam',
          idCardNumber: 'ADMIN-MN',
          employmentStatus: EmploymentStatus.OFFICIAL,
        },
      },
    },
  });

  await prisma.userRole.create({
    data: {
      userId: adminMienNam.id,
      roleId: adminRole.id,
      scopeType: RoleScopeType.REGION,
      scopeId: mienNam.id,
    },
  });

  // 6. RESET SEQUENCE MÃ NHÂN VIÊN VỀ 3 (TÀI KHOẢN MỚI TIẾP THEO SẼ LÀ NV000004)
  console.log('--> [6/6] Đang Reset Sequence user_code_seq về số 3...');
  try {
    const allSeqs = [
      'user_code_seq',
      'task_code_seq',
      'cross_department_request_code_seq',
      'contract_code_seq',
      'warehouse_code_seq',
      'asset_code_seq',
      'stock_receipt_code_seq',
      'material_issue_code_seq',
      'stock_transfer_code_seq',
      'stock_transaction_code_seq',
      'inventory_check_code_seq',
      'payroll_period_code_seq',
      'material_code_seq',
    ];
    for (const seq of allSeqs) {
      await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${seq}" START WITH 1 INCREMENT BY 1;`);
      if (seq !== 'user_code_seq') {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seq}" RESTART WITH 1;`);
      }
    }
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "user_code_seq" RESTART WITH 4;`);
    await prisma.$executeRawUnsafe(`SELECT setval('user_code_seq', 3, true);`);
    console.log('    user_code_seq đã được reset về 3 thành công! (Tài khoản tiếp theo sẽ là NV000004)');
  } catch (err) {
    console.error('    Lưu ý khi reset sequence:', err.message);
  }

  // NGHIỆM THU
  console.log('\n================================================================');
  console.log('          📊 BÁO CÁO NGHIỆM THU DỌN DẸP DATABASE');
  console.log('================================================================');

  const getCount = async (model) => {
    try {
      if (prisma[model] && typeof prisma[model].count === 'function') {
        return await prisma[model].count();
      }
    } catch (e) {}
    return 0;
  };

  const [
    userCount,
    roleCount,
    permissionCount,
    companyCount,
    regionCount,
    branchCount,
    deptCount,
    posCount,
    chatGroupCount,
    reportCount,
    taskCount,
    attendanceCount,
  ] = await Promise.all([
    getCount('user'),
    getCount('role'),
    getCount('permission'),
    getCount('company'),
    getCount('region'),
    getCount('branch'),
    getCount('department'),
    getCount('position'),
    getCount('chatGroup'),
    getCount('dailyReport'),
    getCount('task'),
    getCount('attendance'),
  ]);

  const activeUsers = await prisma.user.findMany({
    select: {
      userCode: true,
      phone: true,
      email: true,
      roles: { include: { role: true } },
      profile: { select: { fullName: true } },
    },
    orderBy: { userCode: 'asc' },
  });

  console.log(`- Doanh nghiệp (Company):    ${companyCount} (Movie Legend)`);
  console.log(`- Vùng Miền (Region):        ${regionCount} (Miền Bắc, Miền Nam)`);
  console.log(`- Bảng Phân Quyền (Roles):   ${roleCount} vai trò`);
  console.log(`- Quyền hạn (Permissions):   ${permissionCount} quyền`);
  console.log(`- Chi nhánh (Branch):        ${branchCount} (Đã xóa về 0 để setup mới)`);
  console.log(`- Phòng ban (Department):    ${deptCount} (Đã xóa về 0 để setup mới)`);
  console.log(`- Chức vụ (Position):        ${posCount} (Đã xóa về 0 để setup mới)`);
  console.log(`- Nhóm Chat:                 ${chatGroupCount} (Đã xóa sạch)`);
  console.log(`- Báo cáo ngày:              ${reportCount} (Đã xóa sạch)`);
  console.log(`- Dữ liệu chấm công:         ${attendanceCount} (Đã xóa sạch)`);
  console.log(`- Tổng số tài khoản User:    ${userCount} (Chính xác 3 tài khoản Admin)\n`);

  console.log('👑 DANH SÁCH 3 TÀI KHOẢN QUẢN TRỊ VIÊN HIỆN CÓ:');
  activeUsers.forEach((u) => {
    const rolesStr = u.roles.map((r) => `${r.role.code} (${r.scopeType})`).join(', ');
    console.log(`  ⭐ Mã: ${u.userCode} | Tên: ${u.profile?.fullName} | SĐT: ${u.phone} | Email: ${u.email} | Quyền: [${rolesStr}]`);
  });

  console.log('\n🎉 HOÀN TẤT DỌN DẸP VÀ RESET DATABASE!');
}

main()
  .catch((e) => {
    console.error('❌ LỖI TRONG QUÁ TRÌNH DỌN DẸP:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
