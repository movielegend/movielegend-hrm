const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang tiến hành sửa dữ liệu Enum ---');
  const newValues = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];
  for (const val of newValues) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "AssetConditionStatus" ADD VALUE '${val}';`);
      console.log(`+ Đã thêm ${val}`);
    } catch (e) {
      // Đã có rồi thì bỏ qua
    }
  }

  try {
    await prisma.$executeRawUnsafe(`UPDATE "assets" SET "conditionStatus" = 'GOOD' WHERE "conditionStatus" = 'OK';`);
    await prisma.$executeRawUnsafe(`UPDATE "assets" SET "conditionStatus" = 'DAMAGED' WHERE "conditionStatus" = 'BROKEN';`);
    await prisma.$executeRawUnsafe(`UPDATE "assets" SET "conditionStatus" = 'FAIR' WHERE "conditionStatus" = 'PENDING';`);
    console.log('+ Đã cập nhật bảng assets');
  } catch (e) {
    console.log('Lỗi cập nhật assets:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenAssigned" = 'GOOD' WHERE "conditionWhenAssigned" = 'OK';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenAssigned" = 'DAMAGED' WHERE "conditionWhenAssigned" = 'BROKEN';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenAssigned" = 'FAIR' WHERE "conditionWhenAssigned" = 'PENDING';`);

    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenReturned" = 'GOOD' WHERE "conditionWhenReturned" = 'OK';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenReturned" = 'DAMAGED' WHERE "conditionWhenReturned" = 'BROKEN';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenReturned" = 'FAIR' WHERE "conditionWhenReturned" = 'PENDING';`);
    console.log('+ Đã cập nhật bảng asset_assignments');
  } catch (e) {
    console.log('Lỗi cập nhật asset_assignments:', e.message);
  }

  console.log('=== Xong! Bây giờ bạn hãy chạy tiếp lệnh Prisma bên dưới ===');
  await prisma.$disconnect();
}

main();
