import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.shiftAssignment.findMany({
    include: { shift: true }
  });
  console.log('Total assignments:', assignments.length);
  assignments.forEach(a => {
    console.log(`Date: ${a.workDate}, Shift Start: ${a.shift?.startTime}`);
  });
}

main().finally(() => prisma.$disconnect());
