import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu cập nhật Enum để tránh mất dữ liệu...');

  try {
    // 1. Thêm các giá trị mới vào Enum hiện tại của PostgreSQL
    // (Bỏ qua lỗi nếu giá trị đã tồn tại)
    const newValues = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];
    for (const val of newValues) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "AssetConditionStatus" ADD VALUE '${val}';`);
        console.log(`Đã thêm giá trị ${val} vào Enum.`);
      } catch (e: any) {
        // Bỏ qua lỗi nếu giá trị đã được thêm từ trước
        if (!e.message.includes('already exists')) {
          console.log(`Lưu ý với ${val}:`, e.message);
        }
      }
    }

    // 2. Cập nhật dữ liệu cũ sang dữ liệu mới trên bảng assets
    console.log('Cập nhật dữ liệu trên bảng assets...');
    await prisma.$executeRawUnsafe(`UPDATE "assets" SET "conditionStatus" = 'GOOD' WHERE "conditionStatus" = 'OK';`);
    await prisma.$executeRawUnsafe(`UPDATE "assets" SET "conditionStatus" = 'DAMAGED' WHERE "conditionStatus" = 'BROKEN';`);
    await prisma.$executeRawUnsafe(`UPDATE "assets" SET "conditionStatus" = 'FAIR' WHERE "conditionStatus" = 'PENDING';`);

    // 3. Cập nhật dữ liệu cũ trên bảng asset_assignments
    console.log('Cập nhật dữ liệu trên bảng asset_assignments...');
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenAssigned" = 'GOOD' WHERE "conditionWhenAssigned" = 'OK';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenAssigned" = 'DAMAGED' WHERE "conditionWhenAssigned" = 'BROKEN';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenAssigned" = 'FAIR' WHERE "conditionWhenAssigned" = 'PENDING';`);

    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenReturned" = 'GOOD' WHERE "conditionWhenReturned" = 'OK';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenReturned" = 'DAMAGED' WHERE "conditionWhenReturned" = 'BROKEN';`);
    await prisma.$executeRawUnsafe(`UPDATE "asset_assignments" SET "conditionWhenReturned" = 'FAIR' WHERE "conditionWhenReturned" = 'PENDING';`);

    console.log('✅ Chuyển đổi dữ liệu thành công! Bây giờ bạn có thể chạy db push.');
  } catch (error) {
    console.error('Lỗi khi chạy script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
