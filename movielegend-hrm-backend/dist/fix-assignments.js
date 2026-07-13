"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Finding shift assignments...');
    const assignments = await prisma.shiftAssignment.findMany({
        include: {
            user: {
                include: { roles: { include: { role: true } }, profile: true }
            }
        }
    });
    const allUsers = await prisma.user.findMany({
        include: { roles: { include: { role: true } } }
    });
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    let deletedCount = 0;
    for (const assignment of assignments) {
        const isUserLeaderOrAdmin = assignment.user.roles.some((r) => ['LEADER', 'ADMIN'].includes(r.role.code.toUpperCase()));
        let isAssignedByAdmin = false;
        if (assignment.assignedByUserId) {
            const assigner = userMap.get(assignment.assignedByUserId);
            if (assigner) {
                isAssignedByAdmin = assigner.roles.some((r) => r.role.code.toUpperCase() === 'ADMIN');
            }
        }
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
//# sourceMappingURL=fix-assignments.js.map