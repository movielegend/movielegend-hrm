const { PrismaClient } = require('@prisma/client');

const renderDbUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: renderDbUrl
    }
  }
});

async function fixMissingColumns() {
  console.log('🔧 Đang kết nối trực tiếp CSDL Render bằng PrismaClient...\n');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionScheduledAt" TIMESTAMP(3);
    `);
    console.log('✅ Đã thêm thành công cột [deletionScheduledAt] vào bảng users trên Render!');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isTestAccount" BOOLEAN DEFAULT false;
    `);
    console.log('✅ Đã thêm thành công cột [isTestAccount] vào bảng users trên Render!');

    console.log('\n🎉 HOÀN TẤT! Đã bổ sung 2 cột còn thiếu trực tiếp trên CSDL Render 100%!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingColumns();
