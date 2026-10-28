const { PrismaClient, AttendanceStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { profile: { fullName: { contains: 'Nguyễn Văn Live' } } },
    include: {
      profile: true,
      departmentLinks: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!user) {
    console.error('User Nguyễn Văn Live not found!');
    process.exit(1);
  }

  console.log(`Found user: ${user.profile?.fullName} (ID: ${user.id})`);
  
  // Get department ID
  let departmentId = user.departmentLinks[0]?.departmentId;
  if (!departmentId) {
    // If not in departmentLinks, find Live department
    const liveDept = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { contains: 'Live', mode: 'insensitive' } },
          { code: { contains: 'LIVE', mode: 'insensitive' } },
        ],
      },
    });
    departmentId = liveDept?.id;
  }
  
  if (!departmentId) {
    // Fallback to any active department
    const anyDept = await prisma.department.findFirst({ where: { isActive: true } });
    departmentId = anyDept?.id;
  }

  console.log(`Using departmentId: ${departmentId}`);

  // Month: October 2026 (or current month/year)
  // Let's check current date
  const now = new Date();
  const year = now.getFullYear(); // 2026
  const month = now.getMonth(); // 9 (0-indexed = October)
  console.log(`Seeding attendance for year: ${year}, month: ${month + 1}`);

  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 31 for October

  // Delete existing records for this user in this month to have a clean, accurate set
  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, daysInMonth, 23, 59, 59));

  const deleteResult = await prisma.attendanceRecord.deleteMany({
    where: {
      userId: user.id,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  console.log(`Cleared ${deleteResult.count} old records for ${month + 1}/${year}`);

  // Create records for day 1 to daysInMonth (1 to 31)
  const createdRecords = [];
  for (let day = 1; day <= daysInMonth; day++) {
    // Date at 00:00:00 UTC
    const workDate = new Date(Date.UTC(year, month, day, 0, 0, 0));

    // Realistic check-in: 08:00:00 to 08:25:00 local time (ICT = UTC+7) -> UTC 01:00:00 to 01:25:00
    // ICT is UTC+7
    const checkInHourICT = 8;
    const checkInMinute = Math.floor(Math.random() * 20); // 08:00 - 08:19
    const checkInSecond = Math.floor(Math.random() * 59);

    // Convert ICT to UTC Date
    // 08:xx ICT = (8-7) = 01:xx UTC
    const checkInAt = new Date(Date.UTC(year, month, day, checkInHourICT - 7, checkInMinute, checkInSecond));

    // Realistic check-out: 17:30 to 18:00 ICT -> UTC 10:30 to 11:00
    const checkOutHourICT = 17;
    const checkOutMinute = 30 + Math.floor(Math.random() * 30); // 17:30 - 17:59
    const checkOutSecond = Math.floor(Math.random() * 59);
    const checkOutAt = new Date(Date.UTC(year, month, day, checkOutHourICT - 7, checkOutMinute, checkOutSecond));

    createdRecords.push({
      userId: user.id,
      departmentId,
      workDate,
      checkInAt,
      checkOutAt,
      status: AttendanceStatus.CHECKED_OUT,
      notes: 'Chấm công tự động cả tháng',
      lateMinutes: 0,
    });
  }

  // Insert all records
  await prisma.attendanceRecord.createMany({
    data: createdRecords,
  });

  console.log(`Successfully created ${createdRecords.length} attendance records for Nguyễn Văn Live in ${month + 1}/${year}!`);

  // Verify by querying
  const count = await prisma.attendanceRecord.count({
    where: {
      userId: user.id,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  console.log(`Verified total records in DB for this month: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error running seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
