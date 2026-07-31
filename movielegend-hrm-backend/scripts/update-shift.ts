import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.shift.updateMany({
    data: { checkInLateMinutes: 60 },
  });
  console.log(`Da cap nhat thanh cong ${result.count} ca lam viec thanh 60 phut di tre!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
