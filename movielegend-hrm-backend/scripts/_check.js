const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.leaveType.findMany({ where: { isActive: true } }),
  p.user.findFirst({ where: { userCode: 'TEST_U05' }, include: { departmentLinks: { where: { isPrimary: true } } } }),
]).then(([types, u]) => {
  console.log('LeaveTypes:', JSON.stringify(types, null, 2));
  console.log('\nTEST_U05 id:', u ? u.id : 'NOT FOUND');
  console.log('TEST_U05 dept:', u?.departmentLinks?.[0]?.departmentId ?? 'N/A');
  return p.$disconnect();
}).catch(e => { console.error(e.message); return p.$disconnect(); });
