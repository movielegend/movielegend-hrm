"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.branch.updateMany({
        where: { deletedAt: { not: null } },
        data: { deletedAt: null },
    });
    console.log(`Đã khôi phục thành công ${result.count} chi nhánh bị xóa.`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=restore-branches.js.map