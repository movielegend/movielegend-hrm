import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of invalid department chat group members...');

  const deletedCount = await prisma.$executeRaw`
    DELETE FROM "chat_group_members" cgm
    USING "chat_groups" cg
    WHERE cgm."groupId" = cg."id"
      AND cg."type" = 'DEPARTMENT'
      AND cg."departmentId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "department_members" dm
        WHERE dm."departmentId" = cg."departmentId"
          AND dm."userId" = cgm."userId"
          AND dm."leftAt" IS NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM "departments" d
        WHERE d."id" = cg."departmentId"
          AND d."leaderUserId" = cgm."userId"
          AND d."isActive" = true
          AND d."deletedAt" IS NULL
      );
  `;

  console.log(`Successfully cleaned up ${deletedCount} invalid department chat group member records.`);
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
