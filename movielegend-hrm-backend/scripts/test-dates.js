require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  // Dashboard logic
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const dashRecords = await prisma.attendanceRecord.findMany({
    where: { workDate: { gte: start, lte: end } }
  });

  // Attendance logic
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const exact = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  
  const attRecords = await prisma.attendanceRecord.findMany({
    where: { workDate: { equals: exact } }
  });

  console.log('Dashboard logic (gte, lte):', dashRecords.length, 'records');
  console.log('Attendance logic (equals):', attRecords.length, 'records');
  console.log('exact date:', exact.toISOString());
  console.log('start date:', start.toISOString(), 'end date:', end.toISOString());
  
  if (dashRecords.length > 0) {
    console.log('Dash record workDates:');
    dashRecords.forEach(r => console.log('  ', r.workDate.toISOString()));
  }
}
main().finally(() => prisma.$disconnect());
