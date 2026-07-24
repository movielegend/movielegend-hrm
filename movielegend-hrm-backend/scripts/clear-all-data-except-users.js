const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 🚀 BẮT ĐẦU XÓA SẠCH DỮ LIỆU TẤT CẢ CÁC BẢNG (KỂ CẢ DANH MỤC CA LÀM, CHỈ GIỮ BẢNG USERS) ---');

  // Danh sách toàn bộ các bảng nghiệp vụ + bảng Danh mục ca làm
  const tablesToTruncate = [
    // Danh mục Ca làm & Phân ca
    'shift_assignments',
    'shift_registrations',
    'shift_swaps',
    'shifts', // <-- Danh mục định nghĩa Ca làm (Ca sáng, ca chiều...)

    // Chấm công & Vị trí
    'attendance_verifications',
    'attendance_adjustments',
    'attendance_records',
    'location_trackings',

    // Đơn từ & Nghỉ phép
    'leave_balances',
    'leave_requests',
    'overtime_requests',
    'employee_requests',

    // Lương thưởng
    'payroll_items',
    'payroll_calculation_snapshots',
    'payrolls',
    'payroll_periods',
    'salary_profiles',
    'employee_salary_components',
    'employee_bonuses',
    'employee_deductions',

    // Hợp đồng & Mẫu hợp đồng & Hồ sơ nhân viên
    'contract_signatures',
    'employee_contracts',
    'contract_template_versions',
    'contract_templates',
    'employee_documents',
    'employee_bank_accounts',
    'employee_profiles',

    // Công việc (Tasks)
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

    // Trò chuyện (Chat)
    'chat_group_members',
    'chat_messages',
    'chat_groups',

    // Tài sản & Sự cố
    'asset_assignment_histories',
    'asset_assignments',
    'asset_incident_reports',
    'asset_maintenance_records',
    'assets',

    // Kho & Vật tư
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

    // Thông báo & Đăng nhập & Duyệt
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

  console.log(`--> Đang dọn dẹp ${tablesToTruncate.length} bảng dữ liệu...`);

  for (const table of tablesToTruncate) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`  ✓ Đã xóa sạch bảng: ${table}`);
    } catch (e) {
      // Bỏ qua nếu bảng chưa khởi tạo
    }
  }

  const userCount = await prisma.user.count();

  console.log('\n🎉 ======================================================= 🎉');
  console.log(`✅ ĐÃ XÓA SẠCH TẤT CẢ CA LÀM VÀ DỮ LIỆU CÁC BẢNG NÊU TRÊN!`);
  console.log(`✅ BẢO TỒN NGUYÊN VẸN ${userCount} TÀI KHOẢN BẢNG USERS CỦA HỆ THỐNG.`);
  console.log('🎉 ======================================================= 🎉\n');
}

main()
  .catch(e => {
    console.error('Lỗi khi thực thi xóa:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
