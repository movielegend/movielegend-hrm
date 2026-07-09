"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const activeDepartments = await prisma.department.findMany({
        where: { deletedAt: null },
    });
    console.log('Active departments:', activeDepartments.map(d => ({ id: d.id, code: d.code, name: d.name })));
}
main().finally(() => { prisma.$disconnect(); });
//# sourceMappingURL=check-active.js.map