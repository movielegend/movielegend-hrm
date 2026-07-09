const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const roles = await prisma.userRole.findMany({ include: { role: true, user: true }});
  console.log(roles.map(r => ({ user: r.user.phone, role: r.role.code })));
}
main().finally(() => prisma.$disconnect());
