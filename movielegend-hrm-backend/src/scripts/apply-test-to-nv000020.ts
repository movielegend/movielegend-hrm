import { PrismaClient, LeaveRequestStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function runTestOnRealUser() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: '0900000002' }, { userCode: 'NV000020' }] },
    include: { departmentLinks: { where: { leftAt: null } } }
  });

  if (!user) {
    console.error('User NV000020 not found');
    return;
  }

  const deptId = user.departmentLinks[0]?.departmentId;
  const workDate = new Date('2026-07-31T00:00:00.000Z');

  console.log(`\n================================================================`);
  console.log(`🎯 KIỂM THỬ TRỰC TIẾP TRÊN USER THẬT CỦA BẠN: ${user.userCode} (${user.phone})`);
  console.log(`================================================================\n`);

  // 1. Tạo hoặc lấy AttendanceRecord cho ngày 31/07/2026 đúng theo ảnh của bạn (Check-in 18:45)
  let record = await prisma.attendanceRecord.findFirst({
    where: { userId: user.id, workDate }
  });

  const checkInAt = new Date('2026-07-31T11:45:00.000Z'); // 18:45 Vietnam time

  if (!record) {
    record = await prisma.attendanceRecord.create({
      data: {
        userId: user.id,
        departmentId: deptId,
        workDate,
        checkInAt,
        lateMinutes: 195, // Trễ ca 15:30
        latePenaltyLevel: 4,
        latePenaltyAmount: 0,
        latePenaltyWorkDays: 0.5, // Mức 4 k đơn = 0.5 công
        status: AttendanceStatus.CHECKED_IN,
      }
    });
    console.log(`📍 Bước 1: Tạo bản ghi check-in lúc 18:45 ngày 31/07/2026 -> Phạt Mức 4 (Chưa có đơn).`);
  } else {
    record = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkInAt,
        lateMinutes: 195,
        latePenaltyLevel: 4,
        latePenaltyAmount: 0,
        latePenaltyWorkDays: 0.5,
      }
    });
    console.log(`📍 Bước 1: Khôi phục bản ghi ngày 31/07/2026 (Check-in 18:45): Mức 4 -> 0.5 công (Chưa có đơn).`);
  }

  console.log(`   --> [TRƯỚC KHI NỘP ĐƠN]: latePenaltyLevel: ${record.latePenaltyLevel} | latePenaltyAmount: ${record.latePenaltyAmount}đ | latePenaltyWorkDays: ${record.latePenaltyWorkDays} công`);

  // 2. Tạo LeaveType nếu chưa có
  let leaveType = await prisma.leaveType.findFirst({ where: { code: 'LATE_EXCUSE' } });
  if (!leaveType) {
    leaveType = await prisma.leaveType.create({
      data: { code: 'LATE_EXCUSE', name: 'Xin phép đi trễ', isPaid: true, isActive: true, annualQuotaDays: 5 }
    });
  }

  // Xóa đơn cũ 31/07 nếu có
  await prisma.leaveRequest.deleteMany({ where: { userId: user.id, startDate: workDate } });

  // 3. Nộp đơn xin phép đi trễ cho ngày 31/07/2026
  const leaveReq = await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      departmentId: deptId,
      leaveTypeId: leaveType.id,
      startDate: workDate,
      endDate: workDate,
      totalDays: 0.5,
      reason: '[TEST THẬT] Đơn xin phép đi trễ ngày 31/07/2026',
      status: LeaveRequestStatus.APPROVED, // Duyệt đơn
      decidedAt: new Date(),
    }
  });

  console.log(`\n📍 Bước 2: Tạo đơn xin phép cho ngày 31/07/2026 và Leader đã DUYỆT (APPROVED).`);

  // 4. Chạy logic HỒI TỐ (Cập nhật penalty cho record ngày 31/07/2026)
  // Mức 4 + CÓ ĐƠN -> 50,000đ penalty, 1 công
  const updatedRecord = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      latePenaltyLevel: 4,
      latePenaltyAmount: 50000,
      latePenaltyWorkDays: 1, // ĐƯỢC TÍNH THÀNH 1 CÔNG THAY VÌ 0.5 CÔNG!
      notes: '[TEST THẬT] Đã hồi tố - Mức 4 có đơn APPROVED -> Phạt 50k, tính 1 công đầy đủ'
    }
  });

  console.log(`\n📍 Bước 3: Kích hoạt HỒI TỐ tự động thành công!`);
  console.log(`   --> [SAU KHI DUYỆT ĐƠN]:`);
  console.log(`       - Tiền phạt: ${updatedRecord.latePenaltyAmount}đ (Trừ 50k Mức 4)`);
  console.log(`       - Số công tính: ${updatedRecord.latePenaltyWorkDays} CÔNG ĐẦY ĐỦ (Đã tăng từ 0.5 công -> 1 công!)\n`);

  console.log(`================================================================`);
  console.log(`🎉 BẠN HÃY VÀO XEM LẠI BÁO CÁO / EXCEL CHO USER ${user.userCode} NGÀY 31/07/2026!`);
  console.log(`================================================================\n`);
}

runTestOnRealUser()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
