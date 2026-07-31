process.env.DATABASE_URL = 'postgresql://postgres:210203@127.0.0.1:5432/movielegend_hrm?schema=public';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const deletedRecords = await prisma.attendanceRecord.deleteMany({
    where: { workDate: { gte: start, lte: end } }
  });
  
  const deletedShifts = await prisma.shiftAssignment.deleteMany({
    where: { workDate: { gte: start, lte: end } }
  });

  console.log('Deleted records:', deletedRecords.count, 'Deleted shifts:', deletedShifts.count);
}
main().finally(() => prisma.$disconnect());
