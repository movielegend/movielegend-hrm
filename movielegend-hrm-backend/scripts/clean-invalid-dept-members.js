const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanInvalidDeptMembers() {
  const deptGroupMembers = await prisma.chatGroupMember.findMany({
    where: {
      group: { type: 'DEPARTMENT' }
    },
    include: {
      group: { select: { id: true, name: true, departmentId: true } },
      user: {
        select: {
          id: true,
          userCode: true,
          profile: { select: { fullName: true } },
          roles: { include: { role: true } },
          departmentLinks: { where: { leftAt: null }, select: { departmentId: true } }
        }
      }
    }
  });

  console.log(`Checking ${deptGroupMembers.length} ChatGroupMember records in DEPARTMENT groups...`);
  
  const invalidIds = [];
  for (const m of deptGroupMembers) {
    const userId = m.userId;
    const deptId = m.group?.departmentId;
    const roles = (m.user?.roles || []).map(r => r.role?.code);
    const isAdmin = roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    
    // Check if user is member of this department
    const isDeptMember = (m.user?.departmentLinks || []).some(dm => dm.departmentId === deptId);
    
    // Check if user is leader of this department
    const dept = deptId ? await prisma.department.findUnique({ where: { id: deptId }, select: { leaderUserId: true } }) : null;
    const isDeptLeader = dept?.leaderUserId === userId;

    if (!isAdmin && !isDeptMember && !isDeptLeader) {
      invalidIds.push(m.id);
      console.log(`- Removing invalid record: User ${m.user?.userCode} (${m.user?.profile?.fullName}) from "${m.group?.name}"`);
    }
  }

  if (invalidIds.length > 0) {
    const deleteResult = await prisma.chatGroupMember.deleteMany({
      where: { id: { in: invalidIds } }
    });
    console.log(`Successfully deleted ${deleteResult.count} invalid ChatGroupMember records.`);
  } else {
    console.log('No invalid records to delete.');
  }
}

cleanInvalidDeptMembers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
