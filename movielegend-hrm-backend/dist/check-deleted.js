"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const deletedDepartments = await prisma.department.findMany({
        where: { deletedAt: { not: null } },
    });
    console.log('Deleted departments:', deletedDepartments.map(d => ({ id: d.id, code: d.code, name: d.name })));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check-deleted.js.map