import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ userCode: '0900000002' }, { phone: '0900000002' }] }
  });

  console.log('User 0900000002:', user);

  if (user) {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId: user.id },
      orderBy: { workDate: 'desc' }
    });
    console.log('\nAttendance Records for 0900000002:', records);

    const leaves = await prisma.leaveRequest.findMany({
      where: { userId: user.id }
    });
    console.log('\nLeave Requests for 0900000002:', leaves);

    const ots = await prisma.overtimeRequest.findMany({
      where: { userId: user.id }
    });
    console.log('\nOT Requests for 0900000002:', ots);
  }

  const allLatestRecords = await prisma.attendanceRecord.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { userCode: true, phone: true } } }
  });
  console.log('\nLatest 10 Attendance Records overall:', allLatestRecords);
}

check().then(() => prisma.$disconnect());
