"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const developmentDatabaseUrl = process.env.DATABASE_URL;
if (!testDatabaseUrl) {
    console.error('TEST_DATABASE_URL is required. Refusing to touch DATABASE_URL.');
    process.exit(1);
}
if (developmentDatabaseUrl && testDatabaseUrl === developmentDatabaseUrl) {
    console.error('TEST_DATABASE_URL must not equal DATABASE_URL. Refusing to touch the development database.');
    process.exit(1);
}
const result = (0, child_process_1.spawnSync)('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
    },
});
process.exit(result.status ?? 1);
//# sourceMappingURL=prepare-test-db.js.map