import { PrismaClient, AttendanceStatus } from '@prisma/client';
import moment from 'moment-timezone';

const prisma = new PrismaClient();

async function main() {
  // 1. Find user Nguyễn Văn Live
  const users = await prisma.user.findMany({
    where: {
      profile: {
        fullName: {
          contains: 'Nguyễn Văn Live',
          mode: 'insensitive',
        },
      },
    },
    include: {
      profile: true,
      departmentLinks: {
        include: { department: true },
      },
    },
  });

  console.log(`Found ${users.length} matching users:`);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Code: ${u.userCode}, Name: ${u.profile?.fullName}, Dept: ${u.departmentLinks?.[0]?.department?.name}`);
  }

  if (users.length === 0) {
    console.log('No user found matching Nguyễn Văn Live');
    return;
  }

  // Select target user (e.g. Nguyễn Văn Live or the first one)
  const targetUser = users.find(u => u.profile?.fullName === 'Nguyễn Văn Live') || users[0];
  console.log(`\nTarget user: ${targetUser.profile?.fullName} (${targetUser.id})`);

  const departmentId = targetUser.departmentLinks?.[0]?.departmentId;
  if (!departmentId) {
    console.error('User has no department linked!');
    return;
  }

  // Find standard shift in system or department
  const shift = await prisma.shift.findFirst({
    where: {
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Using shift: ${shift?.name || 'Default'} (${shift?.id})`);

  const targetDates = [
    '2026-10-07',
    '2026-10-09',
  ];

  for (const dateStr of targetDates) {
    const workDate = new Date(`${dateStr}T00:00:00.000Z`);

    // Check / create ShiftAssignment
    let shiftAssignment = await prisma.shiftAssignment.findFirst({
      where: {
        userId: targetUser.id,
        workDate,
      },
    });

    if (!shiftAssignment && shift) {
      shiftAssignment = await prisma.shiftAssignment.create({
        data: {
          userId: targetUser.id,
          shiftId: shift.id,
          departmentId,
          workDate,
          isAssignedByManager: true,
        },
      });
      console.log(`Created ShiftAssignment for date ${dateStr}: ${shiftAssignment.id}`);
    }

    // CheckIn: 08:00, CheckOut: 17:30 (Asia/Ho_Chi_Minh timezone)
    const checkInAt = moment.tz(`${dateStr} 08:00:00`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Ho_Chi_Minh').toDate();
    const checkOutAt = moment.tz(`${dateStr} 17:30:00`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Ho_Chi_Minh').toDate();

    // Check existing AttendanceRecord
    const existingRec = await prisma.attendanceRecord.findFirst({
      where: {
        userId: targetUser.id,
        workDate,
      },
    });

    if (existingRec) {
      const updated = await prisma.attendanceRecord.update({
        where: { id: existingRec.id },
        data: {
          checkInAt,
          checkOutAt,
          status: AttendanceStatus.CHECKED_OUT,
          lateMinutes: 0,
          latePenaltyAmount: 0,
          latePenaltyWorkDays: 0,
          notes: 'Chấm công tự động hệ thống',
        },
      });
      console.log(`Updated AttendanceRecord for date ${dateStr}: ${updated.id} (${checkInAt.toISOString()} -> ${checkOutAt.toISOString()})`);
    } else {
      const created = await prisma.attendanceRecord.create({
        data: {
          userId: targetUser.id,
          departmentId,
          shiftAssignmentId: shiftAssignment?.id,
          workDate,
          checkInAt,
          checkOutAt,
          status: AttendanceStatus.CHECKED_OUT,
          lateMinutes: 0,
          latePenaltyAmount: 0,
          latePenaltyWorkDays: 0,
          notes: 'Chấm công tự động hệ thống',
        },
      });
      console.log(`Created AttendanceRecord for date ${dateStr}: ${created.id} (${checkInAt.toISOString()} -> ${checkOutAt.toISOString()})`);
    }
  }

  console.log('\nDone creating attendance records!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
