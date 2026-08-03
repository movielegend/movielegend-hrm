import { PrismaClient, LeaveRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser0900000002() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: '0900000002' }, { userCode: 'NV000020' }] },
    include: {
      departmentLinks: { include: { department: true } },
      shiftAssignments: { include: { shift: true } }
    }
  });

  console.log('User:', user?.id, user?.userCode, user?.phone);
  console.log('Shift Assignments:', JSON.stringify(user?.shiftAssignments, null, 2));

  if (user) {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Attendance Records:', JSON.stringify(records, null, 2));

    const leaves = await prisma.leaveRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Leave Requests:', JSON.stringify(leaves, null, 2));

    const ots = await prisma.overtimeRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log('OT Requests:', JSON.stringify(ots, null, 2));
  }
}

checkUser0900000002().then(() => prisma.$disconnect());
