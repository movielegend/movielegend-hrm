import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const shifts = await prisma.shift.findMany({
    select: { id: true, code: true, name: true, startTime: true, endTime: true }
  });
  console.log('--- SHIFTS ---');
  console.log(JSON.stringify(shifts, null, 2));

  // Check if Đoàn Nam Dương already has any shift assignments or attendance records
  const userId = '03e95b56-45bd-45f5-913e-77272be9f5c6';
  const myShifts = await prisma.shiftAssignment.findMany({
    where: { userId },
    include: { shift: true }
  });
  console.log('--- USER SHIFT ASSIGNMENTS ---');
  console.log(JSON.stringify(myShifts, null, 2));

  const myAttendance = await prisma.attendanceRecord.findMany({
    where: { userId },
    include: { shiftAssignment: true }
  });
  console.log('--- USER ATTENDANCE RECORDS ---');
  console.log(JSON.stringify(myAttendance, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
