const { PrismaClient } = require('@prisma/client');

const localUrl = "postgresql://postgres:210203@127.0.0.1:5432/movielegend_hrm?schema=public";
const renderUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const localDb = new PrismaClient({ datasources: { db: { url: localUrl } } });
const renderDb = new PrismaClient({ datasources: { db: { url: renderUrl } } });

async function checkPermissions() {
  console.log('🔍 KIỂM TRA DỮ LIỆU CÁC BẢNG PHÂN QUYỀN (ROLES, PERMISSIONS, USER_ROLES)...\n');

  try {
    // 1. Roles
    const renderRoles = await renderDb.role.findMany({ include: { _count: { select: { permissions: true, users: true } } } });
    console.log(`🔑 1. Danh sách Vai trò (Roles) trên Render (${renderRoles.length}):`);
    renderRoles.forEach(r => {
      console.log(`   - [${r.code}] ${r.name} | ${r._count.permissions} quyền | ${r._count.users} người dùng`);
    });

    // 2. Permissions count
    const renderPermCount = await renderDb.permission.count();
    console.log(`\n📋 2. Tổng số Quyền hạn (Permissions) trên Render: ${renderPermCount} quyền.`);

    // 3. RolePermissions count
    const renderRolePermCount = await renderDb.rolePermission.count();
    console.log(`\n🔗 3. Tổng số Liên kết Role-Permission trên Render: ${renderRolePermCount} bản ghi.`);

    // 4. UserRoles count & details
    const renderUserRoles = await renderDb.userRole.findMany({
      include: {
        user: { select: { phone: true, profile: { select: { fullName: true } } } },
        role: { select: { code: true, name: true } }
      }
    });
    console.log(`\n👤 4. Danh sách Phân quyền Người dùng (UserRoles) trên Render (${renderUserRoles.length}):`);
    renderUserRoles.forEach(ur => {
      console.log(`   - SĐT: ${ur.user?.phone} | Name: ${ur.user?.profile?.fullName || 'Admin'} | Role: ${ur.role?.code} | Scope: ${ur.scopeType}`);
    });

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await localDb.$disconnect();
    await renderDb.$disconnect();
  }
}

checkPermissions();
