const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { photoFile: true, user: true, verifications: true }
  });
  console.dir(records, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
