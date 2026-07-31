const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  console.log('Range:', start, end);

  const scheduled = await prisma.shiftAssignment.count({ where: { workDate: { gte: start, lte: end } } });
  const checkedIn = await prisma.attendanceRecord.count({ where: { workDate: { gte: start, lte: end } } });

  console.log('Scheduled:', scheduled, 'Checked In:', checkedIn);
}
main().finally(() => prisma.$disconnect());
