import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirstOrThrow({
    where: { profile: { fullName: { contains: 'Đoàn Nam Dương' } } }
  });

  const records = await prisma.attendanceRecord.findMany({
    where: { userId: user.id },
    orderBy: { workDate: 'desc' }
  });

  console.log('Attendance Records for Doan Nam Duong:');
  for (const r of records) {
    const hours = (r.checkOutAt!.getTime() - r.checkInAt.getTime()) / (1000 * 60 * 60);
    console.log(`- Date: ${r.workDate.toISOString().slice(0, 10)} | CheckIn: ${r.checkInAt.toISOString()} | CheckOut: ${r.checkOutAt?.toISOString()} | Worked: ${hours} hours | Status: ${r.status}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
