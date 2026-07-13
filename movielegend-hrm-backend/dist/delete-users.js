"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
    let adminId = null;
    for (const user of users) {
        const fullName = user.profile?.fullName;
        const isKeepName = fullName && keepNames.includes(fullName);
        const isAdmin = user.roles.some(r => r.role.code.toUpperCase() === 'ADMIN');
        if (isAdmin) {
            adminId = user.id;
        }
        if (!isKeepName && !isAdmin) {
            try {
                console.log(`Deleting user: ${fullName || user.userCode} ...`);
                await prisma.$transaction(async (tx) => {
                    await tx.attendanceRecord.deleteMany({ where: { userId: user.id } });
                    await tx.shiftAssignment.deleteMany({ where: { assignedByUserId: user.id } });
                    await tx.shiftAssignment.deleteMany({ where: { userId: user.id } });
                    await tx.assetAssignment.deleteMany({ where: { assignedToUserId: user.id } });
                    if (adminId) {
                        await tx.contractTemplate.updateMany({ where: { createdById: user.id }, data: { createdById: adminId } });
                        await tx.contractTemplateVersion.updateMany({ where: { createdById: user.id }, data: { createdById: adminId } });
                        await tx.assetAssignment.updateMany({ where: { assignedById: user.id }, data: { assignedById: adminId } });
                        await tx.employeeContract.updateMany({ where: { createdById: user.id }, data: { createdById: adminId } });
                    }
                    await tx.user.delete({ where: { id: user.id } });
                });
                console.log(` -> Deleted successfully.`);
                deletedCount++;
            }
            catch (err) {
                console.error(` -> Failed to delete user ${fullName || user.userCode}. Reason: ${err.message}`);
                failedCount++;
            }
        }
        else {
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
//# sourceMappingURL=delete-users.js.map