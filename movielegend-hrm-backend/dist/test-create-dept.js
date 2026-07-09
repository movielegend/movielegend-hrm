"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const company = await prisma.company.findFirst();
    console.log('Creating test dept');
    const dept = await prisma.department.create({
        data: {
            companyId: company.id,
            code: 'TEST_ERR',
            name: 'Test Error',
        }
    });
    console.log('Created:', dept.code);
    console.log('Soft deleting');
    await prisma.department.update({
        where: { id: dept.id },
        data: {
            deletedAt: new Date(),
            code: `${dept.code}_del_${Date.now()}`
        }
    });
    console.log('Recreating');
    try {
        const newDept = await prisma.department.create({
            data: {
                companyId: company.id,
                code: 'TEST_ERR',
                name: 'Test Error',
            }
        });
        console.log('Recreated successfully:', newDept.code);
    }
    catch (err) {
        console.error('Error recreating:', err.code, err.message);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=test-create-dept.js.map