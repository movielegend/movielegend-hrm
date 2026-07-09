"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.task.deleteMany({});
    console.log(Deleted, tasks.);
}
main().catch(console.error).finally(() => prisma.());
//# sourceMappingURL=delete-all-tasks.js.map