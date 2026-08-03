import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findRecord() {
  const records = await thisPrisma().attendanceRecord.findMany({
    where: {
      workDate: new Date('2026-07-31T00:00:00.000Z'),
    },
    include: {
      user: true,
      shiftAssignment: { include: { shift: true } }
    }
  });

  console.log('Records for 31/07/2026:', JSON.stringify(records, null, 2));
}

function thisPrisma() { return prisma; }

findRecord().then(() => prisma.$disconnect());
