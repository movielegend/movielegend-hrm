import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.task.deleteMany({});
  console.log(Deleted  tasks.);
}
main().catch(console.error).finally(() => prisma.());
