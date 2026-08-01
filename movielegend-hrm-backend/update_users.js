const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = [
    '0900000001',
    '0900000002',
    '0900000003',
    '0900000004',
    '0900000005',
    '0900000006',
    '0900000007',
    '0900000008'
  ];

  for (const phone of phones) {
    const result = await prisma.user.updateMany({
      where: { phone },
      data: {
        accountStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        isActive: true
      }
    });
    console.log(`Updated user with phone ${phone}: ${result.count} record(s)`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
