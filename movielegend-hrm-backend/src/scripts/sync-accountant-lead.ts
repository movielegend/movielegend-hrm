import { PrismaClient, RoleScopeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accountingDepts = await prisma.department.findMany({
    where: {
      OR: [
        { code: { in: ['KT', 'ACCOUNTING'] } },
        { name: { contains: 'kế toán', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Tìm thấy ${accountingDepts.length} phòng ban kế toán:`);

  // Ensure roles exist
  const accLeadRole = await prisma.role.upsert({
    where: { code: 'ACCOUNTANT_LEAD' },
    create: {
      code: 'ACCOUNTANT_LEAD',
      name: 'Kế toán trưởng',
      description: 'Kế toán trưởng - Toàn quyền quản trị tài chính, phê duyệt lương, thưởng và chi tiêu',
      isSystem: true
    },
    update: { name: 'Kế toán trưởng' }
  });

  const accBaseRole = await prisma.role.upsert({
    where: { code: 'ACCOUNTANT' },
    create: {
      code: 'ACCOUNTANT',
      name: 'Kế toán',
      description: 'Vai trò Kế toán chung hệ thống',
      isSystem: true
    },
    update: { name: 'Kế toán' }
  });

  for (const dept of accountingDepts) {
    let leaderUser = null;
    if (dept.leaderUserId) {
      leaderUser = await prisma.user.findUnique({
        where: { id: dept.leaderUserId },
        include: { profile: true }
      });
    }

    console.log(`- Phòng: ${dept.name} (ID: ${dept.id}), Leader: ${leaderUser?.profile?.fullName || leaderUser?.userCode || 'Chưa có'}`);
    if (dept.leaderUserId && leaderUser) {
      // Assign ACCOUNTANT & ACCOUNTANT_LEAD to department leader
      for (const r of [accBaseRole, accLeadRole]) {
        const exists = await prisma.userRole.findFirst({
          where: { userId: dept.leaderUserId, roleId: r.id, scopeType: RoleScopeType.GLOBAL }
        });
        if (!exists) {
          await prisma.userRole.create({
            data: { userId: dept.leaderUserId, roleId: r.id, scopeType: RoleScopeType.GLOBAL }
          });
          console.log(`  + Đã gán role ${r.code} cho Leader ${leaderUser.userCode}`);
        } else {
          console.log(`  = Leader ${leaderUser.userCode} đã có role ${r.code}`);
        }
      }

      // Update position
      let posLead = await prisma.position.findUnique({ where: { code: 'POS_ACCOUNTANT_LEAD' } });
      if (!posLead) {
        posLead = await prisma.position.create({
          data: {
            code: 'POS_ACCOUNTANT_LEAD',
            name: 'Kế toán trưởng',
            departmentId: dept.id,
            isActive: true
          }
        });
      }
      await prisma.employeeProfile.updateMany({
        where: { userId: dept.leaderUserId },
        data: { positionId: posLead.id }
      });
      await prisma.departmentMember.updateMany({
        where: { userId: dept.leaderUserId },
        data: { positionId: posLead.id }
      });
      console.log(`  + Đã cập nhật chức danh Kế toán trưởng cho Leader ${leaderUser.userCode}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
