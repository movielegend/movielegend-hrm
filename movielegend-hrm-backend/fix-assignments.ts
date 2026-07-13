import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding shift assignments...');
  const assignments = await prisma.shiftAssignment.findMany({
    include: {
      user: {
        include: { roles: { include: { role: true } }, profile: true }
      }
    }
  });

  // Fetch all users to check assigner roles
  const allUsers = await prisma.user.findMany({
    include: { roles: { include: { role: true } } }
  });
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  let deletedCount = 0;

  for (const assignment of assignments) {
    // Check if the assigned user is a Leader or Admin
    const isUserLeaderOrAdmin = assignment.user.roles.some((r: any) => 
      ['LEADER', 'ADMIN'].includes(r.role.code.toUpperCase())
    );

    // Get assigner
    let isAssignedByAdmin = false;
    if (assignment.assignedByUserId) {
      const assigner = userMap.get(assignment.assignedByUserId);
      if (assigner) {
        isAssignedByAdmin = assigner.roles.some((r: any) => r.role.code.toUpperCase() === 'ADMIN');
      }
    }

    // If assigned by Admin but user is not Leader/Admin
    if (isAssignedByAdmin && !isUserLeaderOrAdmin) {
      console.log(`Deleting invalid assignment for user: ${assignment.user.profile?.fullName || assignment.user.userCode}`);
      await prisma.shiftAssignment.delete({
        where: { id: assignment.id }
      });
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} invalid shift assignments.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
