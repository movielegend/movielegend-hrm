const { PrismaClient } = require('@prisma/client');

const renderDbUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: renderDbUrl
    }
  }
});

async function runFixAndCheck() {
  console.log('🔍 1. Đang kiểm tra danh sách các cột hiện có trên bảng users của Render...');
  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('   Các cột hiện tại:', cols.map(c => c.column_name).join(', '));

    console.log('\n🔧 2. Đang phát lệnh thêm 2 cột deletionScheduledAt và isTestAccount...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionScheduledAt" TIMESTAMP(3);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isTestAccount" BOOLEAN DEFAULT false;
    `);

    console.log('\n🔍 3. Kiểm tra lại danh sách các cột sau khi thêm:');
    const colsAfter = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('   Các cột mới nhất:', colsAfter.map(c => c.column_name).join(', '));

  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runFixAndCheck();
