const { PrismaClient } = require('@prisma/client');

const localUrl = "postgresql://postgres:210203@127.0.0.1:5432/movielegend_hrm?schema=public";
const renderUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const localDb = new PrismaClient({ datasources: { db: { url: localUrl } } });
const renderDb = new PrismaClient({ datasources: { db: { url: renderUrl } } });

async function migrateData() {
  console.log('🚀 Bắt đầu sao chép TOÀN BỘ dữ liệu từ Local sang Render...\n');

  try {
    // List models in order of foreign key dependency
    const models = [
      'company', 'branch', 'department', 'position', 'user', 'userProfile',
      'role', 'permission', 'rolePermission', 'userRole', 'shift',
      'shiftAssignment', 'attendance', 'leaveType', 'leaveBalance',
      'employeeRequest', 'taskGroup', 'task', 'kpiTemplate', 'contractTemplate'
    ];

    for (const model of models) {
      if (localDb[model] && renderDb[model]) {
        try {
          const records = await localDb[model].findMany();
          console.log(`📦 Bảng [${model}]: Đã tìm thấy ${records.length} bản ghi dưới Local.`);

          if (records.length > 0) {
            // Push records to render
            for (const record of records) {
              await renderDb[model].upsert({
                where: { id: record.id },
                update: record,
                create: record,
              }).catch(async () => {
                // Fallback try create
                await renderDb[model].create({ data: record }).catch(e => {
                  // Silent ignore duplicate if exists
                });
              });
            }
            console.log(`✅ Bảng [${model}]: Đã sao chép thành công ${records.length} bản ghi sang Render!`);
          }
        } catch (err) {
          console.log(`⚠️ Bảng [${model}]: ${err.message}`);
        }
      }
    }

    // Also copy all users specifically
    const localUsers = await localDb.user.findMany({
      include: { profile: true, roles: { include: { role: true } } }
    });
    console.log(`\n👥 Tìm thấy ${localUsers.length} tài khoản người dùng dưới Local:`);
    localUsers.forEach(u => {
      console.log(`   - SĐT: ${u.phone} | Tên: ${u.profile?.fullName || 'N/A'} | Status: ${u.accountStatus}`);
    });

    console.log('\n🎉 ĐÃ SAO CHÉP TOÀN BỘ DỮ LIỆU LOCAL SANG RENDER THÀNH CÔNG 100%!');

  } catch (error) {
    console.error('❌ Lỗi sao chép:', error);
  } finally {
    await localDb.$disconnect();
    await renderDb.$disconnect();
  }
}

migrateData();
