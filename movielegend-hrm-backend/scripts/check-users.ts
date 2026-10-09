import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Roles:', await prisma.role.count());
  console.log('Departments:', await prisma.department.count());
  console.log('Companies:', await prisma.company.count());
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      email: true,
      accountStatus: true,
      profile: {
        select: {
          fullName: true,
        },
      },
      roles: {
        select: {
          scopeType: true,
          scopeId: true,
          role: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      },
      departmentLinks: {
        select: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Total users:', users.length);
  for (const u of users) {
    console.log(
      `Phone: ${u.phone} | Name: ${u.profile?.fullName} | Roles: ${u.roles.map((r: any) => r.role.code).join(', ')} | Status: ${u.accountStatus} | Dept: ${u.departmentLinks.map((d: any) => d.department.name).join(', ')}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
