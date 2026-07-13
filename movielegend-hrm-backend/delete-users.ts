import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keepNames = [
    "Nguyễn Văn B", 
    "Nguyễn Văn C", 
    "Nguyễn Văn D", 
    "Đinh Văn Học"
  ];

  console.log('Fetching users...');
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      roles: { include: { role: true } }
    }
  });

  let deletedCount = 0;
  let failedCount = 0;
  let adminId: string | null = null;

  for (const user of users) {
    const fullName = user.profile?.fullName;
    const isKeepName = fullName && keepNames.includes(fullName);
    const isAdmin = user.roles.some(r => r.role.code.toUpperCase() === 'ADMIN');

    if (isAdmin) {
      adminId = user.id; // Store first admin ID found
    }

    if (!isKeepName && !isAdmin) {
      try {
        console.log(`Deleting user: ${fullName || user.userCode} ...`);
        
        // Explicitly delete some relations that might not have Cascade
        await prisma.$transaction(async (tx) => {
          // 1. Delete AttendanceRecords FIRST to avoid shiftAssignment FK error
          await tx.attendanceRecord.deleteMany({ where: { userId: user.id } });

          // 2. Delete ShiftAssignments
          await tx.shiftAssignment.deleteMany({ where: { assignedByUserId: user.id } });
          await tx.shiftAssignment.deleteMany({ where: { userId: user.id } });

          // 3. Delete AssetAssignments where user is target (avoids SET NULL constraint error)
          await tx.assetAssignment.deleteMany({ where: { assignedToUserId: user.id } });

          // 4. Reassign records where user is the creator/assigner to Admin
          if (adminId) {
            await tx.contractTemplate.updateMany({ where: { createdById: user.id }, data: { createdById: adminId } });
            await tx.contractTemplateVersion.updateMany({ where: { createdById: user.id }, data: { createdById: adminId } });
            await tx.assetAssignment.updateMany({ where: { assignedById: user.id }, data: { assignedById: adminId } });
            await tx.employeeContract.updateMany({ where: { createdById: user.id }, data: { createdById: adminId } });
          }

          // Finally, delete the user (Cascade should handle the rest)
          await tx.user.delete({ where: { id: user.id } });
        });

        console.log(` -> Deleted successfully.`);
        deletedCount++;
      } catch (err: any) {
        console.error(` -> Failed to delete user ${fullName || user.userCode}. Reason: ${err.message}`);
        failedCount++;
      }
    } else {
      console.log(`Skipping user: ${fullName || user.userCode} (Keep/Admin)`);
    }
  }

  console.log(`\nDone! Deleted: ${deletedCount}, Failed: ${failedCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
