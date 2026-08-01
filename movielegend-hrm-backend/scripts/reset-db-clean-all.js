const { PrismaClient, AccountStatus, ApprovalStatus, RoleScopeType } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function safeDeleteAll(modelName) {
  if (prisma[modelName] && typeof prisma[modelName].deleteMany === 'function') {
    try {
      await prisma[modelName].deleteMany({});
    } catch (e) {}
  }
}

async function safeUpdateAll(modelName, dataClause) {
  if (prisma[modelName] && typeof prisma[modelName].updateMany === 'function') {
    try {
      await prisma[modelName].updateMany({ data: dataClause });
    } catch (e) {}
  }
}

async function main() {
  console.log('--- 🚀 BẮT ĐẦU XÓA SẠCH DATABASE (GIỮ ADMIN 0900000000 VÀ RESET MÃ NV VỀ NV000001) ---');

  // 1. Gỡ tham chiếu phòng ban & kho & mẫu hợp đồng & KPI
  await safeUpdateAll('department', { leaderUserId: null });
  await safeUpdateAll('warehouse', { managerUserId: null });
  await safeUpdateAll('contractTemplate', { createdById: null });
  await safeUpdateAll('contractTemplateVersion', { createdById: null });
  await safeUpdateAll('kpiTemplate', { createdById: null });
  await safeUpdateAll('uploadedFile', { uploadedById: null });

  console.log('--> Đang xóa toàn bộ dữ liệu nghiệp vụ (TRUNCATE CASCADE)...');
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `);
    if (tables && tables.length > 0) {
      const tableList = tables.map(t => `"${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE;`);
    }
  } catch (e) {
    console.log('Lỗi khi TRUNCATE:', e);
  }

  // 4. RESET SEQUENCE MÃ NHÂN VIÊN VỀ LẠI 1
  console.log('--> Đang Reset Sequence user_code_seq về lại 1...');
  try {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE user_code_seq RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`SELECT setval('user_code_seq', 1, false)`);
  } catch (e) {
    console.log('Lưu ý khi restart sequence:', e.message);
  }

  // 5. Lấy giá trị mã NV đầu tiên từ Sequence cho Admin (Sẽ ra NV000001)
  const rows = await prisma.$queryRaw`SELECT nextval('user_code_seq')`;
  const nextVal = rows && rows[0] && rows[0].nextval ? rows[0].nextval.toString() : '1';
  const adminUserCode = `NV${nextVal.padStart(6, '0')}`; // Kết quả: NV000001

  // 6. Tạo lại tài khoản Admin chính với mã NV000001
  console.log(`--> Đang tạo tài khoản Admin duy nhất (SĐT: 0900000000 | Mã NV: ${adminUserCode})...`);
  const passwordHash = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.create({
    data: {
      userCode: adminUserCode,
      phone: '0900000000',
      email: 'admin@movielegend.vn',
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true
    }
  });

  // 7. Gán Role ADMIN duy nhất cho Admin
  let adminRole = await prisma.role.findFirst({
    where: { code: 'ADMIN' }
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { code: 'ADMIN', name: 'Quản trị hệ thống' }
    });
  }

  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
      scopeType: RoleScopeType.GLOBAL
    }
  });

  console.log('------------------------------------------------------------------');
  console.log('✅ ĐÃ XÓA TRẮNG DATABASE VÀ RESET MÃ NHÂN VIÊN THÀNH CÔNG!');
  console.log(`👑 Admin hiện tại: Mã [${adminUserCode}] | SĐT: 0900000000 | Mật khẩu: admin123`);
  console.log('➡️  Tài khoản tạo tiếp theo CHẮC CHẮN sẽ nhận Mã [NV000002]!');
  console.log('------------------------------------------------------------------');
  
  // Tự động chạy lại kịch bản phân quyền (seed)
  console.log('--> Đang tự động nạp lại Cấu hình Quyền hệ thống (prisma:seed)...');
  const { execSync } = require('child_process');
  try {
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    console.log('✅ Đã nạp lại bảng quyền (Permissions) thành công!');
  } catch (e) {
    console.error('Lỗi khi tự động nạp quyền:', e.message);
  }
}

main()
  .catch((e) => {
    console.error('Lỗi khi xóa dữ liệu:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
