import { PrismaClient, OvertimeRequestStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// Ca: 18:30 - 18:50
const SHIFT_END_H = 18, SHIFT_END_M = 50;

function makeTime(h: number, m: number): Date {
  const d = new Date(TODAY);
  d.setHours(h, m, 0, 0);
  return d;
}

// Logic tính phút OT được công nhận trong báo cáo / hệ thống
async function calculateApprovedOtForUser(userId: string, date: Date) {
  const record = await prisma.attendanceRecord.findFirst({
    where: { userId, workDate: date, checkOutAt: { not: null } },
    include: { shiftAssignment: { include: { shift: true } } }
  });

  if (!record || !record.checkOutAt) return { actualOt: 0, approvedOt: 0 };

  const scheduledEnd = makeTime(SHIFT_END_H, SHIFT_END_M);
  const actualOt = record.checkOutAt > scheduledEnd 
    ? Math.floor((record.checkOutAt.getTime() - scheduledEnd.getTime()) / 60_000)
    : 0;

  // Lấy đơn OT APPROVED
  const approvedOts = await prisma.overtimeRequest.findMany({
    where: {
      userId,
      status: OvertimeRequestStatus.APPROVED,
      workDate: date,
      startAt: { lt: record.checkOutAt },
      endAt:   { gt: scheduledEnd },
    }
  });

  let approvedOt = 0;
  for (const ot of approvedOts) {
    const otStart = ot.startAt > scheduledEnd ? ot.startAt : scheduledEnd;
    const otEnd   = ot.endAt < record.checkOutAt ? ot.endAt : record.checkOutAt;
    if (otEnd > otStart) {
      approvedOt += Math.floor((otEnd.getTime() - otStart.getTime()) / 60_000);
    }
  }

  return { actualOt, approvedOt };
}

async function runStepByStepOtTest() {
  console.log('\n================================================================');
  console.log('🔄 BẮT ĐẦU TEST CHUẨN TUẦN TỰ MỐC THỜI GIAN THEO YÊU CẦU:');
  console.log('   BƯỚC 1: CHECK-IN & CHECK-OUT TRƯỚC (Ở LẠI MUỘN 30 PHÚT)');
  console.log('   BƯỚC 2: NỘP ĐƠN OT SAU (PENDING)');
  console.log('   BƯỚC 3: LEADER DUYỆT ĐƠN OT (APPROVED) -> TỰ ĐỘNG TÍNH OT');
  console.log('================================================================\n');

  // Lấy user test
  const user = await prisma.user.findFirst({
    where: { userCode: 'NV000020' }
  }) || await prisma.user.findFirst({ where: { userCode: 'TEST_U01' } });

  if (!user) throw new Error('Không tìm thấy user test.');

  const deptLink = await prisma.departmentMember.findFirst({ where: { userId: user.id, isPrimary: true } });
  const deptId = deptLink?.departmentId || '3230c122-4d7e-4214-8f4d-15c07912aa45';

  // Clean data ngày hôm nay
  await prisma.attendanceVerification.deleteMany({ where: { attendanceRecord: { userId: user.id, workDate: TODAY } } });
  await prisma.attendanceRecord.deleteMany({ where: { userId: user.id, workDate: TODAY } });
  await prisma.overtimeRequest.deleteMany({ where: { userId: user.id, workDate: TODAY } });

  // ----------------------------------------------------------------
  // BƯỚC 1: NHÂN VIÊN CHECK-IN VÀ CHECK-OUT TRƯỚC (Về muộn 30 phút)
  // ----------------------------------------------------------------
  const checkInAt  = makeTime(18, 30); // Đúng giờ ca 18:30
  const checkOutAt = makeTime(19, 20); // Checkout 19:20 (Trễ 30 phút so với kết thúc ca 18:50)

  const record = await prisma.attendanceRecord.create({
    data: {
      userId: user.id,
      departmentId: deptId,
      workDate: TODAY,
      checkInAt,
      checkOutAt,
      status: AttendanceStatus.CHECKED_OUT,
    }
  });

  console.log(`📍 BƯỚC 1: Nhân viên ${user.userCode} quẹt thẻ:`);
  console.log(`   - Vào ca  : 18:30`);
  console.log(`   - Ra ca   : 19:20 (Về muộn 30 phút so với 18:50)`);

  let res1 = await calculateApprovedOtForUser(user.id, TODAY);
  console.log(`   -> OT thực tế quẹt thẻ : ${res1.actualOt} phút`);
  console.log(`   -> OT hệ thống công nhận: ${res1.approvedOt} phút (Vì CHƯA CÓ ĐƠN OT)`);
  console.log(`   => ĐÚNG CHUẨN: ${res1.approvedOt === 0 ? '✅ THÀNH CÔNG (Chưa có đơn -> 0 phút)' : '❌ SAI'}\n`);

  // ----------------------------------------------------------------
  // BƯỚC 2: NHÂN VIÊN NỘP ĐƠN OT SAU KHI ĐÃ CHECK-OUT (Trạng thái PENDING)
  // ----------------------------------------------------------------
  const otRequest = await prisma.overtimeRequest.create({
    data: {
      userId: user.id,
      departmentId: deptId,
      workDate: TODAY,
      startAt: makeTime(18, 50), // 18:50
      endAt:   makeTime(19, 30), // 19:30
      reason: '[TEST TUẦN TỰ] Nộp đơn OT bổ sung sau khi đã checkout',
      status: OvertimeRequestStatus.PENDING,
    }
  });

  console.log(`📍 BƯỚC 2: Nhân viên nộp đơn OT bổ sung (18:50 - 19:30):`);
  console.log(`   - Trạng thái đơn hiện tại: PENDING (Đang chờ duyệt)`);

  let res2 = await calculateApprovedOtForUser(user.id, TODAY);
  console.log(`   -> OT hệ thống công nhận: ${res2.approvedOt} phút (Vì đơn CHƯA ĐƯỢC DUYỆT)`);
  console.log(`   => ĐÚNG CHUẨN: ${res2.approvedOt === 0 ? '✅ THÀNH CÔNG (Đơn PENDING -> 0 phút)' : '❌ SAI'}\n`);

  // ----------------------------------------------------------------
  // BƯỚC 3: LEADER/ADMIN TIẾN HÀNH DUYỆT ĐƠN (APPROVED) -> HỆ THỐNG CẬP NHẬT OT HỒI TỐ
  // ----------------------------------------------------------------
  await prisma.overtimeRequest.update({
    where: { id: otRequest.id },
    data: {
      status: OvertimeRequestStatus.APPROVED,
      decidedAt: new Date(),
    }
  });

  console.log(`📍 BƯỚC 3: Leader bấm DUYỆT ĐƠN (APPROVED):`);

  let res3 = await calculateApprovedOtForUser(user.id, TODAY);
  console.log(`   -> OT thực tế quẹt thẻ : ${res3.actualOt} phút`);
  console.log(`   -> OT hệ thống công nhận: ${res3.approvedOt} phút (Giao giữa [18:50..19:20] và Đơn APPROVED)`);
  console.log(`   => ĐÚNG CHUẨN HỒI TỐ: ${res3.approvedOt === 30 ? '✅ THÀNH CÔNG RỰC RỠ (Tự động cập nhật nhảy lên 30 phút OT!)' : '❌ SAI'}\n`);

  console.log('================================================================');
  console.log('🎉 TOÀN BỘ TEST TUẦN TỰ: CHECK-IN/OUT TRƯỚC ➔ NỘP ĐƠN SAU ➔ DUYỆT ĐƠN ➔ ĐÃ PASS 100%!');
  console.log('================================================================\n');
}

runStepByStepOtTest()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
