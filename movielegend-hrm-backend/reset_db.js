const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu dọn dẹp toàn bộ dữ liệu hệ thống (Giữ lại Phân quyền & Tài khoản Admin)...');

  // 1. Tìm danh sách User ID có vai trò ADMIN
  const adminRoles = await prisma.role.findMany({
    where: { code: { contains: 'ADMIN', mode: 'insensitive' } }
  });
  const adminRoleIds = adminRoles.map(r => r.id);

  const adminUserRoles = await prisma.userRole.findMany({
    where: { roleId: { in: adminRoleIds } },
    select: { userId: true }
  });

  let adminUserIds = adminUserRoles.map(ur => ur.userId);

  // Nếu không tìm thấy qua UserRole, tìm theo userCode NV000001
  if (adminUserIds.length === 0) {
    const defaultAdmin = await prisma.user.findFirst({
      where: { OR: [{ userCode: 'NV000001' }, { phone: '0900000000' }, { email: 'admin@gmail.com' }] }
    });
    if (defaultAdmin) {
      adminUserIds = [defaultAdmin.id];
    }
  }

  console.log(`Đã xác định được ${adminUserIds.length} tài khoản Admin cần giữ lại.`);

  // 2. Lấy danh sách tất cả các bảng trong database
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN (
        '_prisma_migrations', 
        'roles', 
        'permissions', 
        'role_permissions',
        'companies'
      );
  `;

  // Tắt kiểm tra khóa ngoại tạm thời để xóa dữ liệu sạch sẽ
  await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

  try {
    for (const t of tables) {
      const tableName = t.table_name;
      if (tableName === 'users') {
        if (adminUserIds.length > 0) {
          const idList = adminUserIds.map(id => `'${id}'`).join(',');
          await prisma.$executeRawUnsafe(`DELETE FROM "users" WHERE id NOT IN (${idList});`);
        }
      } else if (tableName === 'user_roles') {
        if (adminUserIds.length > 0) {
          const idList = adminUserIds.map(id => `'${id}'`).join(',');
          await prisma.$executeRawUnsafe(`DELETE FROM "user_roles" WHERE "userId" NOT IN (${idList});`);
        }
      } else {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      }
      console.log(`-> Đã dọn dẹp xong bảng: ${tableName}`);
    }

    // Đảm bảo luôn có ít nhất 1 Công ty cơ bản trong hệ thống
    await prisma.company.upsert({
      where: { code: 'MOVIE_LEGEND' },
      update: { isActive: true, deletedAt: null },
      create: { code: 'MOVIE_LEGEND', name: 'Movie Legend', isActive: true },
    });

    console.log('\n========================================');
    console.log('HOÀN TẤT! Đã xóa sạch toàn bộ dữ liệu hệ thống.');
    console.log('Bảng phân quyền (roles, permissions, role_permissions), công ty (companies) và tài khoản Admin đã được giữ lại nguyên vẹn.');
    console.log('========================================');
  } catch (err) {
    console.error('Có lỗi xảy ra khi dọn dẹp:', err);
  } finally {
    // Bật lại kiểm tra khóa ngoại
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
