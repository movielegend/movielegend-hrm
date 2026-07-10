"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        include: { roles: { include: { role: true } } }
    });
    for (const user of users) {
        const isAdmin = user.roles.some(r => r.role?.name?.toLowerCase().includes('admin'));
        if (!isAdmin) {
            console.log(`Deactivating and releasing email for user ${user.email} (${user.id})`);
            try {
                await prisma.userRole.deleteMany({
                    where: { userId: user.id }
                });
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
            }
            catch (e) {
                console.error(`Failed to process ${user.email}: ${e.message}`);
            }
        }
        else {
            console.log(`Keeping admin user ${user.email}`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=clear-employees.js.map