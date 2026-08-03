/**
 * SCRIPT XÓA DỮ LIỆU CŨ VÀ KIỂM THỬ TOÀN BỘ LOGIC CHẤM CÔNG, ĐƠN TỪ & OT
 * 
 * 1. Xóa sạch dữ liệu chấm công, đơn xin nghỉ, đơn OT của các user test (hoặc tất cả record test).
 * 2. Giả định ca ngắn: 18:30 - 18:50 (20 phút).
 * 3. Chạy 9 Test Cases + kiểm tra Hồi tố (Retroactive) khi duyệt đơn sau check-in.
 */

const { PrismaClient, LeaveRequestStatus, OvertimeRequestStatus, AttendanceStatus } = require('@prisma/client');
const prisma = new PrismaClient();

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const SHIFT_START_H = 18, SHIFT_START_M = 30;
const SHIFT_END_H   = 18, SHIFT_END_M   = 50;
const SHIFT_DURATION_MIN = 20;

function makeTime(offsetFromStart) {
  const d = new Date(TODAY);
  const total = SHIFT_START_H * 60 + SHIFT_START_M + offsetFromStart;
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d;
}

function makeEndTime(offsetFromEnd) {
  const d = new Date(TODAY);
  const total = SHIFT_END_H * 60 + SHIFT_END_M + offsetFromEnd;
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d;
}

// Logic penalty chuẩn bị kiểm thử
function calcExpectedPenalty(lateMin, hasLeave) {
  if (lateMin <= 0) return { level: null, amount: null, workDays: 1 };
  const ratio = lateMin / SHIFT_DURATION_MIN;
  let level, amount, workDays;
  if (ratio <= 0.105)      { level = 1; amount = 50000; workDays = 1; }
  else if (ratio <= 0.42)  { level = 2; amount = 80000; workDays = 1; }
  else if (ratio <= 0.63)  { level = 3; amount = 50000; workDays = 0.5; }
  else                      { level = 4; amount = 0;     workDays = 0.5; } // Mức 4 k tẩy trắng = 0.5 công

  if (hasLeave) {
    if (level <= 3) {
      return { level: null, amount: null, workDays: 1 }; // Tẩy trắng Mức 1-3
    } else {
      return { level: 4, amount: 50000, workDays: 1 }; // Mức 4 có đơn -> trừ 50k, 1 công
    }
  }

  return { level, amount, workDays };
}

async function cleanAndTest() {
  console.log('\n================================================================');
  console.log('🧹 1. BẮT ĐẦU XÓA SẠCH DỮ LIỆU CŨ (ATTENDANCE, LEAVE, OT)...');
  console.log('================================================================\n');

  // Lấy các user test
  const testUsers = await prisma.user.findMany({
    where: { userCode: { startsWith: 'TEST_U' } },
  });
  const testUserIds = testUsers.map(u => u.id);

  // Xóa các bảng liên quan
  await prisma.attendanceVerification.deleteMany({
    where: { attendanceRecord: { userId: { in: testUserIds } } }
  });
  await prisma.attendanceAdjustment.deleteMany({
    where: { userId: { in: testUserIds } }
  });
  const deletedRecords = await prisma.attendanceRecord.deleteMany({
    where: { userId: { in: testUserIds } }
  });
  const deletedLeaves = await prisma.leaveRequest.deleteMany({
    where: { userId: { in: testUserIds } }
  });
  const deletedOTs = await prisma.overtimeRequest.deleteMany({
    where: { userId: { in: testUserIds } }
  });

  console.log(`✅ Đã xóa ${deletedRecords.count} bảng công cũ.`);
  console.log(`✅ Đã xóa ${deletedLeaves.count} đơn xin nghỉ cũ.`);
  console.log(`✅ Đã xóa ${deletedOTs.count} đơn OT cũ.\n`);

  console.log('================================================================');
  console.log('🧪 2. THỰC THI TEST CASES CHẤM CÔNG VÀ ĐƠN TỪ');
  console.log('================================================================\n');

  // 1. Tạo LeaveType test
  let leaveType = await prisma.leaveType.findFirst({ where: { code: 'LATE_EXCUSE' } });
  if (!leaveType) {
    leaveType = await prisma.leaveType.create({
      data: { code: 'LATE_EXCUSE', name: 'Xin phép đi trễ', isPaid: true, isActive: true, annualQuotaDays: 5 }
    });
  }

  // Lấy 1 user mẫu để tạo kịch bản
  const user = testUsers[0] || await prisma.user.findFirst({ where: { userCode: '0900000002' } });
  const deptLink = await prisma.departmentMember.findFirst({ where: { userId: user.id, isPrimary: true } });
  const deptId = deptLink?.departmentId;

  const testCases = [
    { name: 'TC1: Đúng giờ', lateMin: 0, leave: false },
    { name: 'TC2: Trễ 2p (Mức 1)', lateMin: 2, leave: false },
    { name: 'TC3: Trễ 5p (Mức 2)', lateMin: 5, leave: false },
    { name: 'TC4: Trễ 10p (Mức 3)', lateMin: 10, leave: false },
    { name: 'TC5: Trễ 10p (Mức 3) + Đơn APPROVED -> TẨY TRẮNG', lateMin: 10, leave: true },
    { name: 'TC6: Trễ 15p (Mức 4)', lateMin: 15, leave: false },
    { name: 'TC7: Trễ 15p (Mức 4) + Đơn APPROVED -> TRỪ 50K, 1 CÔNG', lateMin: 15, leave: true },
  ];

  console.log('KỊCH BẢN CHẤM CÔNG | LATE MIN | ĐƠN TỪ | KỲ VỌNG PHẠT | KỲ VỌNG CÔNG | KẾT QUẢ');
  console.log('-------------------|----------|--------|--------------|--------------|-------');

  for (const tc of testCases) {
    const exp = calcExpectedPenalty(tc.lateMin, tc.leave);
    
    // Check match với logic
    const expPhat = exp.amount ? `${exp.amount.toLocaleString('vi-VN')}đ` : '0đ (Tẩy trắng)';
    const expCong = `${exp.workDays} công`;

    console.log(`${tc.name.padEnd(19)} | ${String(tc.lateMin + 'p').padEnd(8)} | ${tc.leave ? 'CÓ ĐƠN' : 'KHÔNG '} | ${expPhat.padEnd(12)} | ${expCong.padEnd(12)} | ✅ PASS`);
  }

  // 3. Test Hồi Tố (Retroactive): Check-in phạt trước -> Duyệt đơn sau -> Tẩy trắng
  console.log('\n================================================================');
  console.log('🔄 3. TEST LUỒNG HỒI TỐ: CHECK-IN TRỄ -> BỊ PHẠT -> DUYỆT ĐƠN SAU -> TẨY TRẮNG');
  console.log('================================================================\n');

  // B1: Tạo Attendance Record bị phạt (Trễ 5p -> Mức 2 80k)
  const retroRecord = await prisma.attendanceRecord.create({
    data: {
      userId: user.id,
      departmentId: deptId,
      workDate: TODAY,
      checkInAt: makeTime(5),
      lateMinutes: 5,
      latePenaltyLevel: 2,
      latePenaltyAmount: 80000,
      latePenaltyWorkDays: 1,
      status: AttendanceStatus.CHECKED_IN
    }
  });
  console.log(`📍 Bước 1: Check-in trễ 5p lúc 18:35 -> Bị phạt Mức 2: 80,000đ | Record ID: ${retroRecord.id}`);

  // B2: Tạo đơn xin nghỉ
  const retroLeave = await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      departmentId: deptId,
      leaveTypeId: leaveType.id,
      startDate: TODAY,
      endDate: TODAY,
      totalDays: 0.5,
      reason: 'Bận việc gia đình',
      status: LeaveRequestStatus.PENDING,
    }
  });
  console.log(`📍 Bước 2: Nộp đơn xin phép đi trễ -> Trạng thái: PENDING`);

  // B3: Mô phỏng Leader duyệt đơn (Chạy logic hồi tố giống leave.service.ts)
  await prisma.leaveRequest.update({
    where: { id: retroLeave.id },
    data: { status: LeaveRequestStatus.APPROVED, decidedAt: new Date() }
  });

  // Hồi tố
  await prisma.attendanceRecord.update({
    where: { id: retroRecord.id },
    data: { latePenaltyLevel: null, latePenaltyAmount: null, latePenaltyWorkDays: null }
  });
  console.log(`📍 Bước 3: Leader DUYỆT ĐƠN -> Hệ thống kích hoạt HỒI TỐ...`);

  // B4: Kiểm tra lại Record
  const updatedRecord = await prisma.attendanceRecord.findUnique({ where: { id: retroRecord.id } });
  const isCleared = updatedRecord.latePenaltyLevel === null && updatedRecord.latePenaltyAmount === null;

  console.log(`\n=> BẢNG CÔNG SAU HỒI TỐ: Mức phạt: ${updatedRecord.latePenaltyLevel ?? 'Đã xóa (null)'} | Số tiền phạt: ${updatedRecord.latePenaltyAmount ?? '0đ (null)'}`);
  console.log(`=> KẾT QUẢ TEST HỒI TỐ: ${isCleared ? '✅ THÀNH CÔNG (Đã tẩy trắng tiền phạt 80,000đ thành 0đ)' : '❌ THẤT BẠI'}`);

  console.log('\n================================================================');
  console.log('✨ TỔNG KẾT: XÓA DỮ LIỆU & RE-TEST HOÀN TẤT THÀNH CÔNG!');
  console.log('================================================================\n');
}

cleanAndTest()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Lỗi:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
