const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const depts = await p.department.findMany({
    where: {
      OR: [
        { name: { contains: 'KẾ TOÁN', mode: 'insensitive' } },
        { code: { contains: 'KT', mode: 'insensitive' } }
      ]
    },
    include: {
      members: {
        include: {
          position: true,
          user: {
            include: {
              profile: { include: { position: true } },
              roles: { include: { role: true } }
            }
          }
        }
      }
    }
  });

  for (const dept of depts) {
    console.log('--- Department:', dept.name, `(${dept.code})`, 'Leader:', dept.leaderUserId);
    for (const m of dept.members) {
      console.log(' - Member:', m.user.userCode, m.user.profile?.fullName, 'Phone:', m.user.phone, 'Position:', m.position?.name || m.user.profile?.position?.name || 'N/A', 'Roles:', m.user.roles.map(r => r.role.code).join(', '));
    }
  }

  const allRoles = await p.role.findMany();
  console.log('\n--- All Roles in DB:');
  console.table(allRoles.map(r => ({ id: r.id, code: r.code, name: r.name })));
}

check().finally(() => p.$disconnect());
