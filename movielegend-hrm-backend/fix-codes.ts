import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany({
    where: {
      deletedAt: { not: null },
      code: { not: { contains: '_del_' } }
    }
  });
  for (const d of depts) {
    await prisma.department.update({
      where: { id: d.id },
      data: { code: `${d.code}_del_${Date.now()}` }
    });
    console.log(`Updated department ${d.code}`);
  }

  const shifts = await prisma.shift.findMany({
    where: {
      deletedAt: { not: null },
      code: { not: { contains: '_del_' } }
    }
  });
  for (const s of shifts) {
    await prisma.shift.update({
      where: { id: s.id },
      data: { code: `${s.code}_del_${Date.now()}` }
    });
    console.log(`Updated shift ${s.code}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
