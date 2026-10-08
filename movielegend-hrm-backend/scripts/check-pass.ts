import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: { phone: { in: ['0900000000', '0975690001'] } },
    select: { id: true, phone: true, passwordHash: true, accountStatus: true },
  });

  for (const u of users) {
    const isPassAdmin123 = await bcrypt.compare('admin123', u.passwordHash);
    const isPass123456 = await bcrypt.compare('123456', u.passwordHash);
    const isPassAdmin = await bcrypt.compare('admin', u.passwordHash);
    console.log(`User ${u.phone}: accountStatus=${u.accountStatus}, admin123=${isPassAdmin123}, 123456=${isPass123456}, admin=${isPassAdmin}`);
  }
}

check().finally(() => prisma.$disconnect());
