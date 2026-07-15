const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Đang xóa tất cả công việc (tasks)...');
  
  // Do các bảng liên kết với Task có thiết lập onDelete: Cascade hoặc cần xóa thủ công
  // Xóa thủ công tất cả Task (tự động xóa theo cascade nếu schema đã cấu hình)
  const result = await prisma.task.deleteMany({});
  
  console.log(`Đã xóa thành công ${result.count} công việc khỏi Database!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
