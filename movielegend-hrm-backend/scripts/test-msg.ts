import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.chatMessage.findMany({
    where: { fileUrl: { not: null } },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(msgs, null, 2));
}

main().finally(() => prisma.$disconnect());
