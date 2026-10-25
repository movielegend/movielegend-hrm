const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const duplicateCodes = [
    'CV4062215770', 'CV4071294152', 'CV4076996405', 'CV4082678074', 'CV4088344878',
    'CV0567064165', 'CV0572767618', 'CV0561326999', 'CV0498437860', 'CV9972225507',
    'CV0508741738', 'CV0514441537', 'CV4252605160', 'CV4263313923', 'CV6334358774'
  ];

  await prisma.workTask.updateMany({
    where: { taskCode: { in: duplicateCodes } },
    data: { isDeleted: true, deletedAt: new Date(), deleteReason: 'Dọn dẹp bản nháp trùng lặp do autosave' }
  });

  console.log('Lead duplicates soft-deleted successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
