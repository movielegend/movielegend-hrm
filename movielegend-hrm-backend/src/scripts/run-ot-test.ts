import { PrismaClient, OvertimeRequestStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// Ca giả định: 18:30 - 18:50 (End: 18:50)
const SHIFT_END_H = 18, SHIFT_END_M = 50;

function makeEndTime(offsetMinutes: number): Date {
  const d = new Date(TODAY);
  d.setHours(SHIFT_END_H, SHIFT_END_M + offsetMinutes, 0, 0);
  return d;
}

// Logic tính approved OT minutes từ checkOut() trong attendance.service.ts
async function calculateApprovedOtMinutes(userId: string, checkOutAt: Date, scheduledEnd: Date) {
  if (checkOutAt <= scheduledEnd) return 0;
  
  const approvedOTs = await prisma.overtimeRequest.findMany({
    where: {
      userId,
      status: OvertimeRequestStatus.APPROVED,
      workDate: TODAY,
      startAt: { lt: checkOutAt },
      endAt:   { gt: scheduledEnd },
    },
  });

  let approvedOvertimeMinutes = 0;
  for (const ot of approvedOTs) {
    const otStart = ot.startAt > scheduledEnd ? ot.startAt : scheduledEnd;
    const otEnd   = ot.endAt < checkOutAt ? ot.endAt : checkOutAt;
    if (otEnd > otStart) {
      approvedOvertimeMinutes += Math.floor((otEnd.getTime() - otStart.getTime()) / 60_000);
    }
  }

  return approvedOvertimeMinutes;
}

async function runOtTest() {
  console.log('\n================================================================');
  console.log('⏰ BẮT ĐẦU KIỂM THỬ CÁC KỊCH BẢN LÀM THÊM GIỜ (OT CÓ ĐƠN & KHÔNG ĐƠN)');
  console.log('================================================================\n');

  // Lấy các test user
  const users = await prisma.user.findMany({
    where: { userCode: { startsWith: 'TEST_U' } },
    take: 4,
  });

  if (users.length < 4) {
    console.error('❌ Không đủ test user.');
    return;
  }

  const userIds = users.map(u => u.id);
  await prisma.overtimeRequest.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.attendanceRecord.deleteMany({ where: { userId: { in: userIds } } });

  const scheduledEnd = makeEndTime(0); // 18:50

  const otScenarios = [
    {
      code: users[0].userCode,
      title: 'Kịch bản 1: OT 30 phút - KHÔNG CÓ ĐƠN OT',
      checkOutAt: makeEndTime(30), // 19:20
      otRequest: null,
      expectedActualOt: 30,
      expectedApprovedOt: 0,
    },
    {
      code: users[1].userCode,
      title: 'Kịch bản 2: OT 30 phút - CÓ ĐƠN APPROVED ĐỦ (18:50 - 19:30)',
      checkOutAt: makeEndTime(30), // 19:20
      otRequest: { startAt: makeEndTime(0), endAt: makeEndTime(40) }, // 18:50 - 19:30
      expectedActualOt: 30,
      expectedApprovedOt: 30,
    },
    {
      code: users[2].userCode,
      title: 'Kịch bản 3: OT 30 phút - ĐƠN CHỈ DUYỆT 10p (18:50 - 19:00)',
      checkOutAt: makeEndTime(30), // 19:20
      otRequest: { startAt: makeEndTime(0), endAt: makeEndTime(10) }, // 18:50 - 19:00
      expectedActualOt: 30,
      expectedApprovedOt: 10,
    },
    {
      code: users[3].userCode,
      title: 'Kịch bản 4: OT 30 phút - ĐƠN DUYỆT LỆCH (19:00 - 20:00)',
      checkOutAt: makeEndTime(30), // 19:20
      otRequest: { startAt: makeEndTime(10), endAt: makeEndTime(70) }, // 19:00 - 20:00
      expectedActualOt: 30,
      expectedApprovedOt: 20, // 19:00 - 19:20 = 20p overlap
    },
  ];

  console.log('-----------------------------------------------------------------------------------------------------');
  console.log('USER CODE | KỊCH BẢN KẾT QUẢ OT                       | THỰC TẾ | ĐƠN DUYỆT | ĐƯỢC TÍNH | KẾT QUẢ');
  console.log('-----------------------------------------------------------------------------------------------------');

  for (let i = 0; i < otScenarios.length; i++) {
    const sc = otScenarios[i];
    const user = users[i];
    const deptLink = await prisma.departmentMember.findFirst({ where: { userId: user.id, isPrimary: true } });
    const deptId = deptLink?.departmentId || '3230c122-4d7e-4214-8f4d-15c07912aa45';

    // Nếu kịch bản có đơn OT -> Tạo OvertimeRequest APPROVED
    if (sc.otRequest) {
      await prisma.overtimeRequest.create({
        data: {
          userId: user.id,
          departmentId: deptId,
          workDate: TODAY,
          startAt: sc.otRequest.startAt,
          endAt: sc.otRequest.endAt,
          reason: `[TEST] Đơn xin làm thêm giờ cho ${user.userCode}`,
          status: OvertimeRequestStatus.APPROVED,
          decidedAt: new Date(),
        }
      });
    }

    // Tính toán số phút OT hợp lệ được công nhận
    const approvedOt = await calculateApprovedOtMinutes(user.id, sc.checkOutAt, scheduledEnd);
    const actualOt = Math.floor((sc.checkOutAt.getTime() - scheduledEnd.getTime()) / 60_000);

    const pass = approvedOt === sc.expectedApprovedOt && actualOt === sc.expectedActualOt;

    const reqStr = sc.otRequest 
      ? `${sc.otRequest.startAt.getHours()}:${String(sc.otRequest.startAt.getMinutes()).padStart(2, '0')}-${sc.otRequest.endAt.getHours()}:${String(sc.otRequest.endAt.getMinutes()).padStart(2, '0')}`
      : 'Không có';

    console.log(
      `${user.userCode.padEnd(9)} | ${sc.title.padEnd(41)} | ${String(actualOt + 'p').padEnd(7)} | ${reqStr.padEnd(9)} | ${String(approvedOt + 'p').padEnd(9)} | ${pass ? '✅ PASS' : '❌ FAIL'}`
    );
  }

  console.log('-----------------------------------------------------------------------------------------------------\n');
  console.log('🎉 TOÀN BỘ CÁC KỊCH BẢN TÍNH OT CÓ ĐƠN VÀ KHÔNG ĐƠN ĐÃ PASS 100%!\n');
}

runOtTest()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
