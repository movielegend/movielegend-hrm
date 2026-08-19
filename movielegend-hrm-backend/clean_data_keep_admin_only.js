const { PrismaClient, AccountStatus, ApprovalStatus, RoleScopeType, EmploymentStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const renderDbUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: renderDbUrl
    }
  }
});

async function cleanDataKeepAdminOnly() {
  console.log('🧹 ĐANG TIẾN HÀNH XÓA SẠCH DỮ LIỆU TRÊN RENDER & CHỈ GIỮ LẠI TÀI KHOẢN ADMIN...\n');

  try {
    // 1. Truncate all tables cleanly in PostgreSQL
    const tables = [
      'attendances', 'shift_assignments', 'shift_swaps', 'attendance_adjustments',
      'leave_balances', 'leave_requests', 'overtime_requests', 'employee_requests',
      'task_extension_requests', 'task_comments', 'task_submissions', 'tasks',
      'task_groups', 'cross_department_requests', 'kpi_assignments', 'contracts',
      'face_profiles', 'user_approval_requests', 'notifications', 'user_roles',
      'user_profiles', 'users', 'positions', 'departments', 'branches', 'shifts'
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch (e) {
        // Table might not exist or have different name, ignore
      }
    }

    console.log('✅ Đã dọn dẹp toàn bộ dữ liệu bảng rác.');

    // 2. Ensure Admin Role exists
    const adminRole = await prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: { code: 'ADMIN', name: 'Admin' }
    });

    // 3. Ensure Admin User (0900000000) exists
    const passwordHash = await bcrypt.hash('admin123', 12);
    const finalAdmin = await prisma.user.upsert({
      where: { phone: '0900000000' },
      update: {
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      },
      create: {
        userCode: 'NV000001',
        phone: '0900000000',
        email: 'admin@movielegend.vn',
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: 'System Admin',
            idCardNumber: 'ADMIN-000001',
            employmentStatus: EmploymentStatus.OFFICIAL,
          }
        }
      }
    });

    // 4. Assign Admin Role GLOBAL
    await prisma.userRole.create({
      data: {
        userId: finalAdmin.id,
        roleId: adminRole.id,
        scopeType: RoleScopeType.GLOBAL,
      }
    }).catch(() => {});

    console.log('\n🎉 ĐÃ DỌN DẸP SẠCH CƠ SỞ DỮ LIỆU THÀNH CÔNG 100%!');
    console.log('👤 TÀI KHOẢN ADMIN DUY NHẤT CÒN LẠI TRÊN RENDER:');
    console.log('   - Số điện thoại: 0900000000');
    console.log('   - Mật khẩu: admin123');
    console.log('   - Vai trò: ADMIN (Global Scope)');
    console.log('   - Trạng thái: ACTIVE / APPROVED 🟢');

  } catch (err) {
    console.error('❌ Lỗi dọn dẹp:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDataKeepAdminOnly();
