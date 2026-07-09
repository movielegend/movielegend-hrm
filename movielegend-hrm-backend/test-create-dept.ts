import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  
  // Create test dept
  console.log('Creating test dept');
  const dept = await prisma.department.create({
    data: {
      companyId: company!.id,
      code: 'TEST_ERR',
      name: 'Test Error',
    }
  });
  console.log('Created:', dept.code);

  // Soft delete it using the exact logic from service
  console.log('Soft deleting');
  await prisma.department.update({
    where: { id: dept.id },
    data: { 
      deletedAt: new Date(),
      code: `${dept.code}_del_${Date.now()}`
    }
  });
  
  // Try recreating
  console.log('Recreating');
  try {
    const newDept = await prisma.department.create({
      data: {
        companyId: company!.id,
        code: 'TEST_ERR',
        name: 'Test Error',
      }
    });
    console.log('Recreated successfully:', newDept.code);
  } catch (err: any) {
    console.error('Error recreating:', err.code, err.message);
  }
}

main().finally(() => prisma.$disconnect());
