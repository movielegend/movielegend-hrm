const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  const deletedUsers = await prisma.user.findMany({ where: { deletedAt: { not: null } }, include: { profile: true } });
  for (const user of deletedUsers) {
    const suffix = '_del_' + Date.now() + Math.floor(Math.random() * 1000);
    let updated = false;
    const data = {};
    if (!user.phone.includes('_del_')) { data.phone = user.phone + suffix; updated = true; }
    if (user.email && !user.email.includes('_del_')) { data.email = user.email + suffix; updated = true; }
    if (!user.userCode.includes('_del_')) { data.userCode = user.userCode + suffix; updated = true; }
    if (updated) {
      await prisma.user.update({ where: { id: user.id }, data });
      console.log('Updated user:', user.phone);
    }
    if (user.profile && !user.profile.idCardNumber.includes('_del_')) {
      await prisma.employeeProfile.update({ where: { userId: user.id }, data: { idCardNumber: user.profile.idCardNumber + suffix } });
      console.log('Updated profile CCCD for user:', user.phone);
    }
  }
  console.log('Done fixing ' + deletedUsers.length + ' deleted users.');
}
fix().catch(console.error).finally(() => prisma.$disconnect());
