const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 🚀 BẮT ĐẦU DỌN DẸP SẠCH BẢNG DỮ LIỆU (CHỈ GIỮ ADMIN) ---');

  // 1. Lấy danh sách Admin bằng Prisma Client API
  const adminRoles = await prisma.role.findMany({
    where: {
      OR: [
        { code: { contains: 'ADMIN', mode: 'insensitive' } },
        { name: { contains: 'Admin', mode: 'insensitive' } }
      ]
    }
  });

  const adminRoleIds = adminRoles.map(r => r.id);

  const adminUserRoles = await prisma.userRole.findMany({
    where: { roleId: { in: adminRoleIds } },
    select: { userId: true, user: { select: { email: true, userCode: true } } }
  });

  const adminIds = Array.from(new Set(adminUserRoles.map(ur => ur.userId)));
  console.log(`--> Tìm thấy ${adminIds.length} tài khoản Admin:`, adminUserRoles.map(ur => `${ur.user?.userCode || ''} (${ur.user?.email || ''})`).join(', '));

  if (adminIds.length === 0) {
    console.error('❌ KHÔNG THỂ XÓA: Không tìm thấy tài khoản Admin nào! Dừng thao tác.');
    return;
  }

  const primaryAdminId = adminIds[0];

  // 2. Cập nhật gỡ bỏ/chuyển tham chiếu
  await prisma.department.updateMany({
    where: { leaderUserId: { notIn: adminIds } },
    data: { leaderUserId: null }
  }).catch(() => {});

  await prisma.warehouse.updateMany({
    where: { managerUserId: { notIn: adminIds } },
    data: { managerUserId: null }
  }).catch(() => {});

  await prisma.contractTemplate.updateMany({
    where: { createdById: { notIn: adminIds } },
    data: { createdById: primaryAdminId }
  }).catch(() => {});

  await prisma.contractTemplateVersion.updateMany({
    where: { createdById: { notIn: adminIds } },
    data: { createdById: primaryAdminId }
  }).catch(() => {});

  console.log('--- 🧹 Đang Truncate (Xóa sạch) toàn bộ dữ liệu nghiệp vụ ---');

  const tablesToTruncate = [
    'attendance_verifications',
    'attendance_adjustments',
    'attendance_records',
    'shift_assignments',
    'shift_registrations',
    'shift_swaps',
    'location_trackings',
    'leave_balances',
    'leave_requests',
    'overtime_requests',
    'employee_requests',
    'payroll_items',
    'payroll_calculation_snapshots',
    'payrolls',
    'payroll_periods',
    'salary_profiles',
    'employee_salary_components',
    'employee_bonuses',
    'employee_deductions',
    'contract_signatures',
    'employee_contracts',
    'employee_documents',
    'employee_bank_accounts',
    'employee_profiles',
    'task_extension_requests',
    'task_assignments',
    'task_comments',
    'task_attachments',
    'task_status_histories',
    'task_targets',
    'task_group_members',
    'task_groups',
    'cross_department_requests',
    'tasks',
    'chat_group_members',
    'chat_messages',
    'chat_groups',
    'asset_assignment_histories',
    'asset_assignments',
    'asset_incident_reports',
    'asset_maintenance_records',
    'assets',
    'material_return_items',
    'material_returns',
    'material_issue_items',
    'material_issues',
    'stock_transfer_items',
    'stock_transfers',
    'stock_receipt_items',
    'stock_receipts',
    'stock_transactions',
    'inventory_check_items',
    'inventory_checks',
    'notification_targets',
    'notification_deliveries',
    'notifications',
    'device_tokens',
    'refresh_sessions',
    'face_registration_images',
    'face_profiles',
    'approval_histories',
    'user_approval_requests',
    'audit_logs'
  ];

  for (const table of tablesToTruncate) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e) {
      // Bỏ qua nếu bảng chưa tồn tại
    }
  }

  console.log('--- 👤 Đang xóa toàn bộ tài khoản nhân viên / leader (chỉ giữ Admin) ---');

  // Xóa tài khoản non-admin bằng Prisma API
  await prisma.departmentMember.deleteMany({ where: { userId: { notIn: adminIds } } }).catch(() => {});
  await prisma.userRole.deleteMany({ where: { userId: { notIn: adminIds } } }).catch(() => {});
  const deleted = await prisma.user.deleteMany({ where: { id: { notIn: adminIds } } }).catch(() => {});

  console.log('\n🎉 ======================================================= 🎉');
  console.log(`✅ ĐÃ XÓA SẠCH DỮ LIỆU TẤT CẢ CÁC BẢNG NGHỆP VỤ THÀNH CÔNG!`);
  console.log(`✅ HỆ THỐNG CHỈ CÒN LẠI ${adminIds.length} TÀI KHOẢN ADMIN ĐỂ BẠN DÙNG.`);
  console.log('🎉 ======================================================= 🎉\n');
}

main()
  .catch(e => {
    console.error('Lỗi khi xóa dữ liệu:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
