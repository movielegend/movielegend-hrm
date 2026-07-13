import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.branch.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  console.log(`Đã khôi phục thành công ${result.count} chi nhánh bị xóa.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
