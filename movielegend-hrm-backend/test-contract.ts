import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const contract = await prisma.employeeContract.findUnique({
    where: { id: 'e396d783-78cd-4207-96e4-55458676a9f2' },
    include: { contractTemplateVersion: true },
  });
  console.log(JSON.stringify(contract, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
