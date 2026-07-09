import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deletedDepartments = await prisma.department.findMany({
    where: { deletedAt: { not: null } },
  });
  console.log('Deleted departments:', deletedDepartments.map(d => ({ id: d.id, code: d.code, name: d.name })));
}

main().finally(() => prisma.$disconnect());
