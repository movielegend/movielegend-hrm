import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { roles: { include: { role: true } } }
  });
  
  for (const user of users) {
    const isAdmin = user.roles.some(r => r.role?.name?.toLowerCase().includes('admin'));
    if (!isAdmin) {
      console.log(`Deactivating and releasing email for user ${user.email} (${user.id})`);
      try {
        // 1. Remove all roles (so they are no longer Leader/Employee)
        await prisma.userRole.deleteMany({
          where: { userId: user.id }
        });

        // 2. Change email and set status to TERMINATED so the original email can be re-registered
        const newEmail = `deleted_${Date.now()}_${user.email}`;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: newEmail,
            accountStatus: 'TERMINATED',
            isActive: false,
          }
        });
        console.log(`Successfully deactivated and released email: ${user.email}`);
      } catch (e: any) {
        console.error(`Failed to process ${user.email}: ${e.message}`);
      }
    } else {
      console.log(`Keeping admin user ${user.email}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
