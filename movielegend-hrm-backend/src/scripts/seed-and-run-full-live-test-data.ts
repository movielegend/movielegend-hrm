import { PrismaClient, LeaveRequestStatus, OvertimeRequestStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const dates = [
  new Date('2026-07-27T00:00:00.000Z'),
  new Date('2026-07-28T00:00:00.000Z'),
  new Date('2026-07-29T00:00:00.000Z'),
  new Date('2026-07-30T00:00:00.000Z'),
  new Date('2026-07-31T00:00:00.000Z'),
  new Date('2026-08-01T00:00:00.000Z'),
];

function makeDateTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  // Adjusted for UTC+7 (Vietnam time)
  d.setUTCHours(hours - 7, minutes, 0, 0);
  return d;
}

async function seedLiveTestData() {
  console.log('\n================================================================');
  console.log('⚡ ĐANG TẠO DỮ LIỆU THỰC TẾ TRÊN DATABASE CHO TẤT CẢ USER');
  console.log('================================================================\n');

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { userCode: { startsWith: 'TEST_U' } },
        { phone: '0900000002' },
        { userCode: 'NV000020' }
      ]
    }
  });

  const userIds = users.map(u => u.id);
  const dept = await prisma.department.findFirst();
  const deptId = dept?.id || '3230c122-4d7e-4214-8f4d-15c07912aa45';

  let leaveType = await prisma.leaveType.findFirst({ where: { code: 'LATE_EXCUSE' } });
  if (!leaveType) {
    leaveType = await prisma.leaveType.create({
      data: { code: 'LATE_EXCUSE', name: 'Xin phép đi trễ', isPaid: true, isActive: true, annualQuotaDays: 5 }
    });
  }

  // Clear old test records
  await prisma.attendanceVerification.deleteMany({ where: { attendanceRecord: { userId: { in: userIds } } } });
  await prisma.attendanceRecord.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.leaveRequest.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.overtimeRequest.deleteMany({ where: { userId: { in: userIds } } });

  console.log(`🧹 Đã dọn dẹp dữ liệu cũ cho ${users.length} tài khoản test.`);

  // Lặp qua từng ngày để chèn dữ liệu đẹp hoàn chỉnh
  for (const date of dates) {
    for (const user of users) {
      // 1. Tạo AttendanceRecord cho ngày đó
      // Check in lúc 18:32 (Trễ 2p) -> Có đơn APPROVED -> Tẩy trắng
      const checkInAt = makeDateTime(date, 18, 32);
      const checkOutAt = makeDateTime(date, 19, 20); // Checkout 19:20 (OT 30p)

      // Tạo đơn xin phép trễ APPROVED
      await prisma.leaveRequest.create({
        data: {
          userId: user.id,
          departmentId: deptId,
          leaveTypeId: leaveType.id,
          startDate: date,
          endDate: date,
          totalDays: 0.5,
          reason: `[TỰ ĐỘNG GIẢ LẬP] Đơn xin phép đi trễ cho ${user.userCode}`,
          status: LeaveRequestStatus.APPROVED,
          decidedAt: new Date(),
        }
      });

      // Tạo đơn OT APPROVED (18:50 - 19:30)
      await prisma.overtimeRequest.create({
        data: {
          userId: user.id,
          departmentId: deptId,
          workDate: date,
          startAt: makeDateTime(date, 18, 50),
          endAt: makeDateTime(date, 19, 30),
          reason: `[TỰ ĐỘNG GIẢ LẬP] Đơn OT cho ${user.userCode}`,
          status: OvertimeRequestStatus.APPROVED,
          decidedAt: new Date(),
        }
      });

      // Tạo bản ghi chấm công đã tẩy trắng & tính OT 30p
      await prisma.attendanceRecord.create({
        data: {
          userId: user.id,
          departmentId: deptId,
          workDate: date,
          checkInAt,
          checkOutAt,
          lateMinutes: 2,
          latePenaltyLevel: null, // Đã tẩy trắng
          latePenaltyAmount: null, // 0đ
          latePenaltyWorkDays: null, // 1 công
          status: AttendanceStatus.CHECKED_OUT,
        }
      });
    }
  }

  console.log(`\n✅ ĐÃ CHÈN DỮ LIỆU ĐẦY ĐỦ CHO TẤT CẢ CÁC NGÀY TỪ 27/07 ĐẾN 01/08!`);
  console.log(`🎉 BẠN VÀO TRANG XUẤT EXCEL / BÁO CÁO BẤM TẢI LẠI TRANG ĐỂ XEM KẾT QUẢ HIỂN THỊ ĐẸP KÍN BẢNG!\n`);
}

seedLiveTestData()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
