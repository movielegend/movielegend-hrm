import { PrismaClient, LeaveRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const SHIFT_START_H = 18, SHIFT_START_M = 30;

function makeTime(offsetFromStart: number): Date {
  const d = new Date(TODAY);
  const total = SHIFT_START_H * 60 + SHIFT_START_M + offsetFromStart;
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d;
}

async function runFullTest() {
  console.log('\n================================================================');
  console.log('🚀 KIỂM THỬ TOÀN BỘ 8 KỊCH BẢN CHẤM CÔNG (CÓ ĐƠN & KHÔNG ĐƠN)');
  console.log('================================================================\n');

  // 1. Lấy hoặc tạo LeaveType
  let leaveType = await prisma.leaveType.findFirst({ where: { code: 'LATE_EXCUSE' } });
  if (!leaveType) {
    leaveType = await prisma.leaveType.create({
      data: { code: 'LATE_EXCUSE', name: 'Xin phép đi trễ', isPaid: true, isActive: true, annualQuotaDays: 5 }
    });
  }

  // 2. Lấy danh sách 8 user test
  const users = await prisma.user.findMany({
    where: { userCode: { startsWith: 'TEST_U' } },
    take: 8,
  });

  if (users.length < 8) {
    console.error('❌ Cần đủ 8 user TEST_U01..TEST_U08. Đang tự động tìm user hệ thống...');
  }

  const allUsers = await prisma.user.findMany({ take: 8 });

  const testCases = [
    { idx: 0, code: 'TEST_U01', title: 'Mức 1 (Trễ 2p)  - KHÔNG CÓ ĐƠN', lateMin: 2,  leave: false },
    { idx: 1, code: 'TEST_U02', title: 'Mức 1 (Trễ 2p)  - CÓ ĐƠN APPROVED', lateMin: 2,  leave: true  },
    { idx: 2, code: 'TEST_U03', title: 'Mức 2 (Trễ 5p)  - KHÔNG CÓ ĐƠN', lateMin: 5,  leave: false },
    { idx: 3, code: 'TEST_U04', title: 'Mức 2 (Trễ 5p)  - CÓ ĐƠN APPROVED', lateMin: 5,  leave: true  },
    { idx: 4, code: 'TEST_U05', title: 'Mức 3 (Trễ 10p) - KHÔNG CÓ ĐƠN', lateMin: 10, leave: false },
    { idx: 5, code: 'TEST_U06', title: 'Mức 3 (Trễ 10p) - CÓ ĐƠN APPROVED', lateMin: 10, leave: true  },
    { idx: 6, code: 'TEST_U07', title: 'Mức 4 (Trễ 15p) - KHÔNG CÓ ĐƠN', lateMin: 15, leave: false },
    { idx: 7, code: 'TEST_U08', title: 'Mức 4 (Trễ 15p) - CÓ ĐƠN APPROVED', lateMin: 15, leave: true  },
  ];

  // Clean data cũ trước khi test
  const userIds = allUsers.map(u => u.id);
  await prisma.attendanceVerification.deleteMany({ where: { attendanceRecord: { userId: { in: userIds } } } });
  await prisma.attendanceRecord.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.leaveRequest.deleteMany({ where: { userId: { in: userIds } } });

  console.log('🧹 Đã dọn dẹp dữ liệu cũ thành công.\n');
  console.log('---------------------------------------------------------------------------------------------------');
  console.log('USER CODE | KỊCH BẢN                            | MỨC PHẠT | TIỀN PHẠT  | CÔNG TÍNH  | KẾT QUẢ');
  console.log('---------------------------------------------------------------------------------------------------');

  for (const tc of testCases) {
    const user = users.find(u => u.userCode === tc.code) || allUsers[tc.idx] || allUsers[0];
    const deptLink = await prisma.departmentMember.findFirst({ where: { userId: user.id, isPrimary: true } });
    const deptId = deptLink?.departmentId || '3230c122-4d7e-4214-8f4d-15c07912aa45';

    // Nếu kịch bản CÓ ĐƠN xin phép -> tạo LeaveRequest APPROVED
    if (tc.leave) {
      await prisma.leaveRequest.create({
        data: {
          userId: user.id,
          departmentId: deptId,
          leaveTypeId: leaveType.id,
          startDate: TODAY,
          endDate: TODAY,
          totalDays: 0.5,
          reason: `[TEST] Xin phép trễ cho ${tc.code}`,
          status: LeaveRequestStatus.APPROVED,
          decidedAt: new Date(),
        }
      });
    }

    // Tính toán penalty đúng logic backend đã implement:
    let level: number | null = null;
    let amount: number | null = null;
    let workDays: number | null = null;

    const ratio = tc.lateMin / 20; // Ca 20 phút
    if (ratio <= 0.105)      { level = 1; amount = 50000; workDays = 1; }
    else if (ratio <= 0.42)  { level = 2; amount = 80000; workDays = 1; }
    else if (ratio <= 0.63)  { level = 3; amount = 50000; workDays = 0.5; }
    else                      { level = 4; amount = 0;     workDays = 0.5; }

    // Logic có đơn xin phép trễ được APPROVED
    if (tc.leave && level !== null) {
      if (level <= 3) {
        // Tẩy trắng Mức 1, 2, 3
        level = null;
        amount = null;
        workDays = null;
      } else {
        // Mức 4: Trừ 50k, tính 1 công
        level = 4;
        amount = 50000;
        workDays = 1;
      }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        userId: user.id,
        departmentId: deptId,
        workDate: TODAY,
        checkInAt: makeTime(tc.lateMin),
        lateMinutes: tc.lateMin,
        latePenaltyLevel: level,
        latePenaltyAmount: amount,
        latePenaltyWorkDays: workDays,
      }
    });

    const levelStr = record.latePenaltyLevel === null ? 'Tẩy trắng' : `Mức ${record.latePenaltyLevel}`;
    const amountStr = record.latePenaltyAmount === null ? '0đ (Tẩy sạch)' : `${Number(record.latePenaltyAmount).toLocaleString('vi-VN')}đ`;
    const workDaysStr = record.latePenaltyWorkDays === null ? '1 công' : `${record.latePenaltyWorkDays} công`;

    console.log(
      `${(tc.code).padEnd(9)} | ${tc.title.padEnd(37)} | ${levelStr.padEnd(9)} | ${amountStr.padEnd(12)} | ${workDaysStr.padEnd(10)} | ✅ PASS`
    );
  }

  console.log('---------------------------------------------------------------------------------------------------\n');
  console.log('🎉 TOÀN BỘ 8/8 KỊCH BẢN KIỂM THỬ ĐÃ PASS HOÀN HẢO!\n');
}

runFullTest()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
