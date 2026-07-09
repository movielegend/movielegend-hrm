"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        where: {
            deletedAt: { not: null },
            phone: { not: { contains: '_del_' } }
        }
    });
    for (const u of users) {
        await prisma.user.update({
            where: { id: u.id },
            data: {
                phone: `${u.phone}_del_${Date.now()}`,
                ...(u.email ? { email: `${u.email}_del_${Date.now()}` } : {}),
                userCode: `${u.userCode}_del_${Date.now()}`,
            }
        });
        console.log(`Updated deleted user ${u.phone}`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=fix-users.js.map