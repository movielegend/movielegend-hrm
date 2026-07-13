const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: { photoFile: true, user: true, verifications: true }
  });
  console.dir(records, { depth: null });
  
  const files = await prisma.uploadedFile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
  });
  console.log("Recent files:", files);
}

main().catch(console.error).finally(() => prisma.$disconnect());
