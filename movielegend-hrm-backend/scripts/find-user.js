const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findFirst({
    where: { userCode: 'NV000024' },
    include: {
      roles: { include: { role: true } },
      profile: true,
      departmentLinks: { include: { department: true, position: true } }
    }
  });
  console.log('Phone:', u?.phone);
  console.log('Name:', u?.profile?.fullName);
  console.log('Roles:', u?.roles?.map(r => r.role.code));
  console.log('Dept:', u?.departmentLinks?.map(d => ({ dept: d.department.name, pos: d.position?.name, isLeader: d.isLeader })));
}
main().finally(() => prisma.$disconnect());
