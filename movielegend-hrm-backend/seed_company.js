const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { code: 'MOVIE_LEGEND' },
    update: { isActive: true, deletedAt: null },
    create: { code: 'MOVIE_LEGEND', name: 'Movie Legend', isActive: true },
  });
  console.log('Đã khôi phục thành công Công ty cơ bản:');
  console.log(company);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
