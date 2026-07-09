import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeDepartments = await prisma.department.findMany({
    where: { deletedAt: null },
  });
  console.log('Active departments:', activeDepartments.map(d => ({ id: d.id, code: d.code, name: d.name })));
}

main().finally(() => { prisma.$disconnect(); });
