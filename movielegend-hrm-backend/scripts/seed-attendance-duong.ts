import { PrismaClient, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      profile: {
        fullName: { contains: 'Đoàn Nam Dương' }
      }
    },
    include: {
      profile: true,
      departmentLinks: { include: { department: true } }
    }
  });

  const departmentId = user.departmentLinks[0]?.departmentId;
  if (!departmentId) {
    throw new Error('User does not have a department link');
  }

  console.log(`Setting attendance for: ${user.profile?.fullName} (${user.phone}) - Dept: ${user.departmentLinks[0]?.department?.name}`);

  // 3 ngày gần nhất: 2026-10-07, 2026-10-08, 2026-10-09
  const days = [
    { dateStr: '2026-10-07', checkIn: '2026-10-07T08:00:00+07:00', checkOut: '2026-10-07T17:30:00+07:00' },
    { dateStr: '2026-10-08', checkIn: '2026-10-08T08:00:00+07:00', checkOut: '2026-10-08T17:30:00+07:00' },
    { dateStr: '2026-10-09', checkIn: '2026-10-09T08:00:00+07:00', checkOut: '2026-10-09T17:30:00+07:00' },
  ];

  for (const day of days) {
    const [year, month, d] = day.dateStr.split('-').map(Number);
    const workDate = new Date(Date.UTC(year, month - 1, d, 0, 0, 0, 0));

    // Xóa record cũ nếu có
    await prisma.attendanceRecord.deleteMany({
      where: {
        userId: user.id,
        workDate,
      }
    });

    const record = await prisma.attendanceRecord.create({
      data: {
        userId: user.id,
        departmentId,
        workDate,
        checkInAt: new Date(day.checkIn),
        checkOutAt: new Date(day.checkOut),
        status: AttendanceStatus.CHECKED_OUT,
        notes: 'Chấm công ca làm việc thực tế > 5h (Đủ điều kiện làm thêm OT Live)',
        checkInIp: '192.168.1.1',
        checkOutIp: '192.168.1.1',
      }
    });

    console.log(`[Success] Created AttendanceRecord for ${day.dateStr}: id=${record.id}, In=${record.checkInAt.toISOString()}, Out=${record.checkOutAt?.toISOString()}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
