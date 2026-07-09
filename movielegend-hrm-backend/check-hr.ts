import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hrDepartments = await prisma.department.findMany({
    where: { code: { startsWith: 'HR' } },
  });
  console.log('Found HR departments:', hrDepartments.map(d => ({ id: d.id, code: d.code, name: d.name, deletedAt: d.deletedAt })));
  
  // Fix them by appending timestamp
  for (const dept of hrDepartments) {
    if (dept.deletedAt && dept.code === 'HR') {
      console.log('Fixing department:', dept.id);
      await prisma.department.update({
        where: { id: dept.id },
        data: { code: `${dept.code}_del_${Date.now()}` }
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
