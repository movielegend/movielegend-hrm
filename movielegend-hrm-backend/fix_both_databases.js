const { PrismaClient } = require('@prisma/client');

// Database URLs
const renderUrl1 = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";
const renderUrl2 = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm?connection_limit=20&pool_timeout=10";

async function fixDatabase(url, name) {
  console.log(`🔧 Đang xử lý database [${name}]...`);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionScheduledAt" TIMESTAMP(3);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isTestAccount" BOOLEAN DEFAULT false;
    `);
    console.log(`✅ Đã thêm cột cho [${name}] thành công!`);
  } catch (err) {
    console.error(`❌ Lỗi [${name}]:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await fixDatabase(renderUrl1, "movielegend_hrm");
  await fixDatabase(renderUrl2, "movielegend_hrm_with_params");
  console.log('\n🎉 HOÀN THÀNH SỬA TẤT CẢ DATABASE TRÊN RENDER!');
}

run();
