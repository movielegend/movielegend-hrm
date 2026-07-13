const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.shift.updateMany({
    where: { code: 'DEMO_DAY' },
    data: {
      checkInLateMinutes: 9999,
      checkInEarlyMinutes: 9999
    }
  });
  console.log('Successfully extended checkIn window for DEMO_DAY shift.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
