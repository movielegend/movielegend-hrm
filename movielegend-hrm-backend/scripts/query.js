const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const assets = await prisma.assetAssignment.findMany({
    where: { assignedToUserId: '4ac7e6f3-33e9-4c44-96b3-dc96acca07a1', status: { in: ['ACTIVE', 'PENDING_CONFIRMATION', 'RETURN_REQUESTED'] } },
    include: {
      asset: {
        select: {
          assetCode: true,
          name: true,
          incidents: { where: { status: { in: ['OPEN', 'INVESTIGATING'] } } },
        },
      },
    },
  });
  console.log(JSON.stringify(assets, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
