import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.chatGroup.updateMany({
    where: {
      departmentId: { not: null },
      type: 'CUSTOM'
    },
    data: {
      type: 'DEPARTMENT'
    }
  });
  console.log(`Updated ${result.count} department chat groups to correct type.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
