import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { phone: '0975690001' },
    data: { passwordHash: hash },
  });
  console.log('RESET_PASSWORD_SUCCESS: 0975690001 -> admin123');
}

main().finally(() => prisma.$disconnect());
