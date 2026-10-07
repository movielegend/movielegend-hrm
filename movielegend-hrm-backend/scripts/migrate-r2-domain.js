require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('🚀 BẮT ĐẦU ĐỒNG BỘ DOMAIN R2 TRONG DATABASE');
  console.log('========================================');

  const oldDomain = 'pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev';
  const newDomain = process.env.S3_PUBLIC_DOMAIN
    ? process.env.S3_PUBLIC_DOMAIN.replace(/^https?:\/\//, '')
    : 'pub-0660681bd72f46b4b644376b0cf8e4db.r2.dev';

  console.log(`📌 Domain cũ: ${oldDomain}`);
  console.log(`📌 Domain mới: ${newDomain}`);
  console.log('----------------------------------------');

  const tasks = [
    {
      table: 'face_registration_images',
      column: 'imageUrl',
      sql: `UPDATE "face_registration_images" SET "imageUrl" = REPLACE("imageUrl", '${oldDomain}', '${newDomain}') WHERE "imageUrl" LIKE '%${oldDomain}%'`,
    },
    {
      table: 'uploaded_files',
      column: 'fileUrl',
      sql: `UPDATE "uploaded_files" SET "fileUrl" = REPLACE("fileUrl", '${oldDomain}', '${newDomain}') WHERE "fileUrl" LIKE '%${oldDomain}%'`,
    },
    {
      table: 'employee_profiles',
      column: 'avatarUrl',
      sql: `UPDATE "employee_profiles" SET "avatarUrl" = REPLACE("avatarUrl", '${oldDomain}', '${newDomain}') WHERE "avatarUrl" LIKE '%${oldDomain}%'`,
    },
    {
      table: 'employee_profiles',
      column: 'idCardFrontUrl',
      sql: `UPDATE "employee_profiles" SET "idCardFrontUrl" = REPLACE("idCardFrontUrl", '${oldDomain}', '${newDomain}') WHERE "idCardFrontUrl" LIKE '%${oldDomain}%'`,
    },
    {
      table: 'employee_profiles',
      column: 'idCardBackUrl',
      sql: `UPDATE "employee_profiles" SET "idCardBackUrl" = REPLACE("idCardBackUrl", '${oldDomain}', '${newDomain}') WHERE "idCardBackUrl" LIKE '%${oldDomain}%'`,
    },
    {
      table: 'employee_documents',
      column: 'fileUrl',
      sql: `UPDATE "employee_documents" SET "fileUrl" = REPLACE("fileUrl", '${oldDomain}', '${newDomain}') WHERE "fileUrl" LIKE '%${oldDomain}%'`,
    },
    {
      table: 'department_documents',
      column: 'fileUrl',
      sql: `UPDATE "department_documents" SET "fileUrl" = REPLACE("fileUrl", '${oldDomain}', '${newDomain}') WHERE "fileUrl" LIKE '%${oldDomain}%'`,
    },
  ];

  let totalUpdated = 0;

  for (const t of tasks) {
    try {
      const count = await prisma.$executeRawUnsafe(t.sql);
      console.log(`✅ [${t.table} -> ${t.column}]: Đã cập nhật ${count} bản ghi`);
      totalUpdated += Number(count || 0);
    } catch (err) {
      console.log(`⚠️  [${t.table} -> ${t.column}]: Bỏ qua (${err.message.split('\n')[0]})`);
    }
  }

  console.log('----------------------------------------');
  console.log(`🎉 TỔNG CỘNG: Đã cập nhật thành công ${totalUpdated} link ảnh sang R2 mới!`);
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
