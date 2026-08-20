const { PrismaClient, RoleScopeType } = require('@prisma/client');

const renderDbUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: renderDbUrl
    }
  }
});

const permissionCodes = [
  'user.read', 'user.update', 'user.manage', 'employee.read', 'employee.update', 'employee.approve',
  'department.create', 'department.read', 'department.update', 'department.delete',
  'position.create', 'position.read', 'position.update', 'position.delete',
  'upload.create', 'role.assign', 'permission.read', 'approval.read', 'approval.approve', 'approval.reject',
  'face.read', 'face.approve', 'shift.create', 'shift.read', 'shift.update', 'shift.delete',
  'shift.assign', 'shift.register', 'shift.swap', 'attendance.read', 'attendance.checkin',
  'attendance.adjust', 'attendance.location.manage', 'leave.type.manage', 'leave.balance.read',
  'leave.request', 'leave.approve', 'overtime.request', 'overtime.approve', 'employee.request',
  'employee.request.approve', 'task.assign_any', 'task.assign_department', 'task.read_all',
  'task.read_department', 'task.read_own', 'task.review_all', 'task.review_department',
  'task.accept_own', 'task.update_progress_own', 'task.submit_own', 'task.comment_own',
  'task.extension_request_own', 'task.extension_review_all', 'task.extension_review_department',
  'task.group.manage_all', 'task.group.manage_department', 'cross_department.create',
  'cross_department.read_all', 'cross_department.source_approve', 'cross_department.target_receive',
  'notification.read', 'device_token.manage_own', 'warehouse.create', 'warehouse.read',
  'warehouse.update', 'warehouse.manage', 'material.create', 'material.read', 'material.update',
  'stock.read', 'stock.import', 'stock.export', 'stock.adjust', 'stock.transfer',
  'material_issue.create', 'material_issue.read', 'material_issue.approve', 'material_issue.issue',
  'asset.create', 'asset.read', 'asset.assign', 'asset.return', 'asset.transfer',
  'asset.incident.create', 'asset.incident.read', 'asset.incident.resolve', 'asset.maintenance.manage',
  'inventory_check.create', 'inventory_check.read', 'inventory_check.submit', 'inventory_check.approve',
  'salary_profile.create', 'salary_profile.read', 'salary_profile.update', 'salary_component.create',
  'salary_component.read', 'salary_component.update', 'payroll_period.create', 'payroll_period.read',
  'payroll.calculate', 'payroll.review', 'payroll.approve', 'payroll.lock', 'payroll.read_all',
  'payroll.read_own', 'bonus.create', 'bonus.read', 'bonus.approve', 'deduction.create',
  'deduction.read', 'deduction.approve', 'violation.create', 'violation.read', 'violation.confirm',
  'disciplinary_action.create', 'disciplinary_action.approve', 'employee_document.read_own',
  'employee_document.read_department', 'employee_document.read_all', 'employee_document.read_sensitive',
  'employee_document.create', 'employee_document.verify', 'contract_template.create',
  'contract_template.read', 'contract_template.update', 'contract.create', 'contract.read_own',
  'contract.read_department', 'contract.read_all', 'contract.approve', 'contract.sign_company',
  'contract.terminate', 'kpi_template.create', 'kpi_template.read', 'kpi_template.update',
  'kpi.assign', 'kpi.read_own', 'kpi.read_department', 'kpi.read_all', 'kpi.self_review',
  'kpi.leader_review', 'kpi.finalize', 'review_cycle.create', 'review_cycle.read',
  'review_cycle.manage', 'performance_review.read_own', 'performance_review.read_department',
  'performance_review.read_all', 'performance_review.self_submit', 'performance_review.leader_submit',
  'performance_review.finalize', 'dashboard.admin.read', 'dashboard.department.read',
  'dashboard.own.read', 'report.employee.read', 'report.attendance.read', 'report.task.read',
  'report.payroll.summary', 'report.payroll.detail', 'report.warehouse.read', 'report.asset.read',
  'report.kpi.read', 'report.export.csv', 'report.export.excel', 'system_setting.read',
  'system_setting.update', 'notification_preference.read_own', 'notification_preference.update_own',
  'audit.read', 'job.read', 'job.run_manual', 'feedback.create', 'feedback.read_own',
  'feedback.read_all', 'feedback.update_status'
];

const leaderPerms = [
  'user.read', 'employee.read', 'employee.approve', 'department.read', 'position.read', 'upload.create',
  'approval.read', 'approval.approve', 'approval.reject', 'face.read', 'shift.read', 'shift.assign',
  'attendance.read', 'leave.balance.read', 'leave.approve', 'overtime.approve', 'employee.request.approve',
  'task.assign_department', 'task.read_department', 'task.review_department', 'task.extension_review_department',
  'task.group.manage_department', 'cross_department.source_approve', 'cross_department.target_receive',
  'notification.read', 'device_token.manage_own', 'material.read', 'stock.read', 'material_issue.create',
  'material_issue.read', 'asset.read', 'asset.incident.create', 'inventory_check.read', 'bonus.create',
  'bonus.read', 'violation.create', 'violation.read', 'employee_document.read_department', 'kpi.read_department',
  'kpi.leader_review', 'performance_review.read_department', 'performance_review.leader_submit',
  'dashboard.department.read', 'report.employee.read', 'report.attendance.read', 'report.task.read',
  'report.asset.read', 'report.kpi.read', 'report.export.csv', 'feedback.create', 'feedback.read_own'
];

const employeePerms = [
  'employee.read', 'department.read', 'position.read', 'upload.create', 'face.read', 'shift.read',
  'shift.register', 'shift.swap', 'attendance.read', 'attendance.checkin', 'attendance.adjust',
  'leave.balance.read', 'leave.request', 'overtime.request', 'employee.request', 'task.read_own',
  'task.accept_own', 'task.update_progress_own', 'task.submit_own', 'task.comment_own',
  'task.extension_request_own', 'cross_department.create', 'notification.read', 'device_token.manage_own',
  'material.read', 'material_issue.create', 'material_issue.read', 'asset.read', 'asset.return',
  'asset.incident.create', 'payroll.read_own', 'employee_document.read_own', 'employee_document.create',
  'contract.read_own', 'kpi.read_own', 'kpi.self_review', 'performance_review.read_own',
  'performance_review.self_submit', 'dashboard.own.read', 'notification_preference.read_own',
  'notification_preference.update_own', 'feedback.create', 'feedback.read_own'
];

const hrPerms = [
  'employee_document.read_own', 'employee_document.read_department', 'employee_document.read_all',
  'employee_document.read_sensitive', 'employee_document.create', 'position.read', 'position.create',
  'position.update', 'upload.create', 'shift.read', 'shift.create', 'shift.update', 'shift.assign',
  'employee_document.verify', 'contract_template.create', 'contract_template.read', 'contract_template.update',
  'contract.create', 'contract.read_own', 'contract.read_department', 'contract.read_all', 'contract.approve',
  'contract.sign_company', 'contract.terminate', 'kpi_template.create', 'kpi_template.read', 'kpi_template.update',
  'kpi.assign', 'kpi.read_own', 'kpi.read_department', 'kpi.read_all', 'kpi.self_review', 'kpi.leader_review',
  'kpi.finalize', 'review_cycle.create', 'review_cycle.read', 'review_cycle.manage', 'performance_review.read_own',
  'performance_review.read_department', 'performance_review.read_all', 'performance_review.self_submit',
  'performance_review.leader_submit', 'performance_review.finalize', 'dashboard.admin.read',
  'dashboard.department.read', 'dashboard.own.read', 'report.employee.read', 'report.attendance.read',
  'report.task.read', 'report.kpi.read', 'report.export.csv', 'report.export.excel', 'system_setting.read',
  'system_setting.update', 'audit.read', 'job.read', 'job.run_manual', 'notification.read',
  'device_token.manage_own', 'feedback.create', 'feedback.read_own', 'feedback.read_all', 'feedback.update_status'
];

async function seedAllRolePermissions() {
  console.log('🌱 Đang nạp đầy đủ ma trận Phân quyền cho ADMIN, HR, LEADER và EMPLOYEE...\n');

  try {
    // 1. Ensure Roles
    const admin = await prisma.role.upsert({ where: { code: 'ADMIN' }, update: {}, create: { code: 'ADMIN', name: 'Admin' } });
    const hr = await prisma.role.upsert({ where: { code: 'HR' }, update: {}, create: { code: 'HR', name: 'Human Resources' } });
    const leader = await prisma.role.upsert({ where: { code: 'LEADER' }, update: {}, create: { code: 'LEADER', name: 'Leader' } });
    const employee = await prisma.role.upsert({ where: { code: 'EMPLOYEE' }, update: {}, create: { code: 'EMPLOYEE', name: 'Employee' } });

    // 2. Create All 176 Permissions
    await prisma.permission.createMany({
      data: permissionCodes.map(code => ({ code, name: code })),
      skipDuplicates: true,
    });

    const allPermMap = new Map();
    const allPerms = await prisma.permission.findMany({ select: { id: true, code: true } });
    allPerms.forEach(p => allPermMap.set(p.code, p.id));

    // 3. Map ADMIN (All 176)
    const adminRolePerms = allPerms.map(p => ({ roleId: admin.id, permissionId: p.id }));
    await prisma.rolePermission.createMany({ data: adminRolePerms, skipDuplicates: true });
    console.log(`✅ Role [ADMIN]: Đã nạp đầy đủ ${adminRolePerms.length} quyền.`);

    // 4. Map HR (65)
    const hrRolePerms = hrPerms.map(code => ({ roleId: hr.id, permissionId: allPermMap.get(code) })).filter(p => p.permissionId);
    await prisma.rolePermission.createMany({ data: hrRolePerms, skipDuplicates: true });
    console.log(`✅ Role [HR]: Đã nạp đầy đủ ${hrRolePerms.length} quyền.`);

    // 5. Map LEADER (52)
    const leaderRolePerms = leaderPerms.map(code => ({ roleId: leader.id, permissionId: allPermMap.get(code) })).filter(p => p.permissionId);
    await prisma.rolePermission.createMany({ data: leaderRolePerms, skipDuplicates: true });
    console.log(`✅ Role [LEADER]: Đã nạp đầy đủ ${leaderRolePerms.length} quyền.`);

    // 6. Map EMPLOYEE (44)
    const employeeRolePerms = employeePerms.map(code => ({ roleId: employee.id, permissionId: allPermMap.get(code) })).filter(p => p.permissionId);
    await prisma.rolePermission.createMany({ data: employeeRolePerms, skipDuplicates: true });
    console.log(`✅ Role [EMPLOYEE]: Đã nạp đầy đủ ${employeeRolePerms.length} quyền.`);

    console.log('\n🎉 ĐÃ NẠP TOÀN BỘ MA TRẬN PHÂN QUYỀN CHO 4 VAI TRÒ CHÍNH THÀNH CÔNG 100%!');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedAllRolePermissions();
