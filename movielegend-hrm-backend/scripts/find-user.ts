import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: {
      profile: {
        fullName: { contains: 'Dương', mode: 'insensitive' }
      }
    },
    include: {
      profile: true,
      departmentLinks: { include: { department: true } }
    }
  });

  console.log('--- FOUND USERS ---');
  console.log(JSON.stringify(users, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
