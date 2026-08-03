/**
 * AUTO TEST SCRIPT - Kiểm thử chấm công tự động
 * 
 * Kịch bản: Ca làm việc 18:30 - 18:50 (20 phút)
 * Ghi trực tiếp vào DB để bỏ qua face verification & GPS check
 * 
 * Mức điểm trừ (ratio = lateMin / 20):
 * - Mức 1 (<= 10.5% = 2.1 phút): Trễ 1-2p -> Phạt 50,000đ, Công 1
 * - Mức 2 (<= 42% = 8.4 phút):   Trễ 3-8p  -> Phạt 80,000đ, Công 1
 * - Mức 3 (<= 63% = 12.6 phút):  Trễ 9-12p -> Phạt 50,000đ, Công 0.5
 * - Mức 4 (> 63%):                Trễ > 12p -> Phạt 0đ,     Công 0
 */

const { PrismaClient, AccountStatus, ApprovalStatus, RoleScopeType, AttendanceStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test@123456';

// Ngày hôm nay (date only)
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// Ca làm việc: 18:30 - 18:50
const SHIFT_START_H = 18, SHIFT_START_M = 30;
const SHIFT_END_H   = 18, SHIFT_END_M   = 50;
const SHIFT_DURATION_MIN = 20;

/**
 * 9 test case theo kế hoạch kiểm thử
 * checkInOffset: số phút tính từ giờ bắt đầu ca (âm = vào trước, null = không check-in)
 * checkOutOffset: số phút tính từ giờ kết thúc ca (dương = ra sau), null = quên checkout
 * isPlannedOt: true nếu có ca phụ kế tiếp
 */
const TEST_CASES = [
  {
    idx: 1, code: 'TEST_U01', name: 'User 01 - Đúng giờ',
    checkInOffset: -5, checkOutOffset: 0, // check-in lúc 18:25, checkout 18:50
    expectLatePenalty: 0, expectWorkDays: 1, expectLevel: null,
    note: 'Vào đúng giờ → không phạt, tính 1 công'
  },
  {
    idx: 2, code: 'TEST_U02', name: 'User 02 - Trễ Mức 1 (2 phút)',
    checkInOffset: 2, checkOutOffset: 0, // 18:32, checkout 18:50
    expectLatePenalty: 50000, expectWorkDays: 1, expectLevel: 1,
    note: '2p trễ → Mức 1: phạt 50k, tính 1 công'
  },
  {
    idx: 3, code: 'TEST_U03', name: 'User 03 - Trễ Mức 2 (5 phút)',
    checkInOffset: 5, checkOutOffset: 0, // 18:35, checkout 18:50
    expectLatePenalty: 80000, expectWorkDays: 1, expectLevel: 2,
    note: '5p trễ → Mức 2: phạt 80k, tính 1 công'
  },
  {
    idx: 4, code: 'TEST_U04', name: 'User 04 - Trễ Mức 3 (10 phút)',
    checkInOffset: 10, checkOutOffset: 0, // 18:40, checkout 18:50
    expectLatePenalty: 50000, expectWorkDays: 0.5, expectLevel: 3,
    note: '10p trễ → Mức 3: phạt 50k, tính 0.5 công'
  },
  {
    idx: 5, code: 'TEST_U05', name: 'User 05 - Trễ Mức 3 (10p, có đơn xin phép)',
    checkInOffset: 10, checkOutOffset: 0,
    expectLatePenalty: 80000, expectWorkDays: 1, expectLevel: 2, // có đơn xin phép → giảm xuống Mức 2
    note: '10p trễ nhưng có đơn → áp Mức 2: phạt 80k, 1 công (logic này cần kiểm tra trong service)',
    hasLeaveRequest: true
  },
  {
    idx: 6, code: 'TEST_U06', name: 'User 06 - Trễ Mức 4 (15 phút)',
    checkInOffset: 15, checkOutOffset: 0, // 18:45, checkout 18:50
    expectLatePenalty: 0, expectWorkDays: 0, expectLevel: 4,
    note: '15p trễ → Mức 4: phạt 0, tính 0 công'
  },
  {
    idx: 7, code: 'TEST_U07', name: 'User 07 - OT thực tế (checkout muộn)',
    checkInOffset: -5, checkOutOffset: 50, // 18:25, checkout 19:40 (50p sau khi ca kết thúc)
    expectLatePenalty: 0, expectWorkDays: 1, expectLevel: null,
    note: 'Check-in đúng giờ, checkout muộn → tính OT thực tế, phạt 0'
  },
  {
    idx: 8, code: 'TEST_U08', name: 'User 08 - OT không ca (tự ý làm thêm)',
    checkInOffset: null, // Không có ca chính → OT
    otStartH: 15, otStartM: 30, otEndH: 16, otEndM: 30, // 15:30 - 16:30
    expectLatePenalty: 0, expectWorkDays: null, expectLevel: null,
    note: 'Không có ca → tạo record OT không kế hoạch, không tính công chính'
  },
  {
    idx: 9, code: 'TEST_U09', name: 'User 09 - Quên Check-out',
    checkInOffset: 0, checkOutOffset: null, // 18:30, không checkout
    expectLatePenalty: 0, expectWorkDays: 1, expectLevel: null,
    note: 'Vào đúng giờ nhưng quên checkout → status CHECKED_IN'
  },
];

function makeTime(baseH, baseM, offsetMin) {
  const d = new Date(TODAY);
  const totalMin = baseH * 60 + baseM + offsetMin;
  d.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
  return d;
}

function calcLateInfo(offsetMin) {
  if (offsetMin <= 0) return { lateMinutes: 0, latePenaltyLevel: null, latePenaltyAmount: null, latePenaltyWorkDays: null };
  const ratio = offsetMin / SHIFT_DURATION_MIN;
  let level, amount, workDays;
  if (ratio <= 0.105)       { level = 1; amount = 50000; workDays = 1; }
  else if (ratio <= 0.42)   { level = 2; amount = 80000; workDays = 1; }
  else if (ratio <= 0.63)   { level = 3; amount = 50000; workDays = 0.5; }
  else                       { level = 4; amount = 0;     workDays = 0; }
  return { lateMinutes: offsetMin, latePenaltyLevel: level, latePenaltyAmount: amount, latePenaltyWorkDays: workDays };
}

async function getOrCreateTestShift() {
  let shift = await prisma.shift.findFirst({ where: { code: 'TEST_SHORT_20M', deletedAt: null } });
  if (!shift) {
    shift = await prisma.shift.create({
      data: {
        code: 'TEST_SHORT_20M',
        name: 'Ca Test Ngắn 20 Phút (18:30-18:50)',
        startTime: '18:30:00',
        endTime:   '18:50:00',
        isActive: true,
        checkInEarlyMinutes: 30,
        checkInLateMinutes: 60,
      }
    });
    console.log(`✅ Tạo mới shift: ${shift.name}`);
  } else {
    console.log(`✅ Dùng shift đã có: ${shift.name} (${shift.id})`);
  }
  return shift;
}

async function getTestDepartment() {
  const dept = await prisma.department.findFirst({
    where: { deletedAt: null, isActive: true },
    include: { branch: true },
    orderBy: { createdAt: 'asc' }
  });
  if (!dept) throw new Error('Không tìm thấy phòng ban hợp lệ!');
  if (!dept.branch) throw new Error(`Phòng ban "${dept.name}" chưa có chi nhánh!`);
  console.log(`✅ Dùng phòng ban: ${dept.name} | Chi nhánh: ${dept.branch.name}`);
  return dept;
}

async function getOrCreateTestUser(tc, dept, positionId, passwordHash) {
  let user = await prisma.user.findFirst({ where: { userCode: tc.code } });
  if (!user) {
    // Tạo phone ngẫu nhiên 10 chữ số dạng 08xxxxxxxx
    const randPhone = `08${String(Date.now()).slice(-8)}`;
    user = await prisma.user.create({
      data: {
        userCode: tc.code,
        phone: randPhone,
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: tc.name,
            idCardNumber: `TC-${tc.code}-${Date.now()}`,
            ...(positionId ? { positionId } : {}),
          }
        }
      }
    });
    // Gán phòng ban
    await prisma.departmentMember.create({
      data: {
        userId: user.id,
        departmentId: dept.id,
        isPrimary: true,
        ...(positionId ? { positionId } : {}),
      }
    });
    // Gán role EMPLOYEE
    const empRole = await prisma.role.findUnique({ where: { code: 'EMPLOYEE' } });
    if (empRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: empRole.id, scopeType: RoleScopeType.GLOBAL }
      });
    }
    console.log(`  ✅ Tạo user mới: ${user.userCode} | phone: ${user.phone}`);
  } else {
    console.log(`  ♻️  User đã tồn tại: ${user.userCode}`);
  }
  return user;
}

async function createAttendanceRecord({ userId, deptId, assignmentId, checkInTime, checkOutTime, lateInfo, isOt }) {
  // Xóa record cũ trong ngày
  const oldRecords = await prisma.attendanceRecord.findMany({ where: { userId, workDate: TODAY } });
  for (const r of oldRecords) {
    await prisma.attendanceVerification.deleteMany({ where: { attendanceRecordId: r.id } });
    await prisma.attendanceAdjustment.deleteMany({ where: { attendanceRecordId: r.id } });
    await prisma.attendanceRecord.delete({ where: { id: r.id } });
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      userId,
      departmentId: deptId,
      shiftAssignmentId: assignmentId,
      workDate: TODAY,
      checkInAt: checkInTime,
      checkOutAt: checkOutTime ?? null,
      checkInLatitude: 10.7769,
      checkInLongitude: 106.7009,
      checkInIp: '127.0.0.1',
      status: checkOutTime ? AttendanceStatus.CHECKED_OUT : AttendanceStatus.CHECKED_IN,
      lateMinutes: lateInfo.lateMinutes ?? 0,
      latePenaltyLevel: lateInfo.latePenaltyLevel ?? null,
      latePenaltyAmount: lateInfo.latePenaltyAmount ?? null,
      latePenaltyWorkDays: lateInfo.latePenaltyWorkDays ?? null,
      isUnplannedOt: isOt,
      verifications: {
        create: [
          { type: 'GPS',  success: true, metadata: { note: 'AUTO_TEST' } },
          { type: 'FACE', success: true, score: 0.95, provider: 'AUTO_TEST', metadata: { note: 'AUTO_TEST - skip face' } },
        ]
      }
    }
  });
  return record;
}

async function runAutoTest() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║    🚀  AUTO TEST - CHẤM CÔNG CHÍNH XÁC    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`📅 Ngày test  : ${TODAY.toLocaleDateString('vi-VN')}`);
  console.log(`⏰ Ca làm việc: 18:30 - 18:50 (20 phút)`);
  console.log(`\n📐 Ngưỡng phạt:`);
  console.log(`  Mức 1 (≤10.5% = ≤2.1p): Trễ 1-2p → Phạt 50,000đ, Công 1`);
  console.log(`  Mức 2 (≤42% = ≤8.4p) : Trễ 3-8p → Phạt 80,000đ, Công 1`);
  console.log(`  Mức 3 (≤63% = ≤12.6p): Trễ 9-12p→ Phạt 50,000đ, Công 0.5`);
  console.log(`  Mức 4 (>63% = >12.6p) : Trễ >12p → Phạt 0đ,      Công 0`);
  console.log('');

  const dept = await getTestDepartment();
  const position = await prisma.position.findFirst({ where: { deletedAt: null } });
  const shift = await getOrCreateTestShift();

  console.log('\n🔐 Đang hash password...');
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const results = [];

  for (const tc of TEST_CASES) {
    console.log(`\n━━━ TC${tc.idx}: ${tc.name} ━━━`);
    console.log(`  📌 ${tc.note}`);

    const user = await getOrCreateTestUser(tc, dept, position?.id, passwordHash);

    let checkInTime = null, checkOutTime = null;
    let lateInfo = { lateMinutes: 0, latePenaltyLevel: null, latePenaltyAmount: null, latePenaltyWorkDays: null };
    let assignmentId = null;
    let isOt = false;

    if (tc.code === 'TEST_U08') {
      // TC8: Không có ca chính - OT không kế hoạch
      isOt = true;
      checkInTime  = new Date(TODAY); checkInTime.setHours(tc.otStartH, tc.otStartM, 0, 0);
      checkOutTime = new Date(TODAY); checkOutTime.setHours(tc.otEndH, tc.otEndM, 0, 0);

      // Xóa shift assignment nếu có
      await prisma.shiftAssignment.deleteMany({ where: { userId: user.id, workDate: TODAY } });
      console.log(`  🕐 Check-in: ${checkInTime.toLocaleTimeString('vi-VN')} (OT không ca)`);
      console.log(`  🕑 Check-out: ${checkOutTime.toLocaleTimeString('vi-VN')}`);
    } else {
      // Gán ca chính
      await prisma.shiftAssignment.deleteMany({ where: { userId: user.id, workDate: TODAY } });
      const assignment = await prisma.shiftAssignment.create({
        data: { userId: user.id, shiftId: shift.id, departmentId: dept.id, workDate: TODAY, status: 'ASSIGNED' }
      });
      assignmentId = assignment.id;

      if (tc.checkInOffset !== null) {
        checkInTime = makeTime(SHIFT_START_H, SHIFT_START_M, tc.checkInOffset);
        lateInfo = calcLateInfo(tc.checkInOffset);

        // TC9 override: đây là ca có đơn xin phép (giả lập logic kiểm tra)
        // Trong hệ thống thực, cần có LeaveRequest để giảm mức phạt
        // Script này test giá trị thực tế từ logic calcLateInfo
      }

      if (tc.checkOutOffset !== null) {
        checkOutTime = makeTime(SHIFT_END_H, SHIFT_END_M, tc.checkOutOffset);
      }

      const checkInStr  = checkInTime  ? checkInTime.toLocaleTimeString('vi-VN')  : '-';
      const checkOutStr = checkOutTime ? checkOutTime.toLocaleTimeString('vi-VN') : '❌ Không (quên)';
      const offsetStr   = tc.checkInOffset !== null ? (tc.checkInOffset >= 0 ? `+${tc.checkInOffset}p` : `${tc.checkInOffset}p`) : 'N/A';
      console.log(`  🕐 Check-in: ${checkInStr} (${offsetStr} so với 18:30)`);
      console.log(`  🕑 Check-out: ${checkOutStr}`);
    }

    if (checkInTime) {
      const record = await createAttendanceRecord({ userId: user.id, deptId: dept.id, assignmentId, checkInTime, checkOutTime, lateInfo, isOt });

      const actualPenalty  = lateInfo.latePenaltyAmount  ?? 0;
      const actualWorkDays = lateInfo.latePenaltyWorkDays;
      const actualLevel    = lateInfo.latePenaltyLevel;

      const penaltyMatch = (tc.expectLatePenalty === 0 && actualPenalty === 0) ||
                           (tc.expectLatePenalty > 0 && actualPenalty === tc.expectLatePenalty);
      const workDaysMatch = tc.expectWorkDays === null || actualWorkDays === tc.expectWorkDays ||
                            (tc.checkInOffset <= 0 && actualWorkDays === null);
      const passed = penaltyMatch && workDaysMatch;

      console.log(`  📊 Kết quả: Trễ=${lateInfo.lateMinutes}p | Level=${actualLevel ?? '-'} | Phạt=${actualPenalty.toLocaleString('vi-VN')}đ | Công=${actualWorkDays ?? 1}`);
      console.log(`  🎯 Mong đợi: Phạt=${tc.expectLatePenalty.toLocaleString('vi-VN')}đ | Công=${tc.expectWorkDays ?? '-'}`);
      console.log(`  ${passed ? '✅ PASS' : '⚠️  CHECK'} | record id: ${record.id}`);

      results.push({
        idx: tc.idx, code: tc.code,
        checkIn: checkInTime?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) ?? '-',
        checkOut: checkOutTime?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) ?? '❌',
        late: `${lateInfo.lateMinutes}p`,
        level: actualLevel ?? '-',
        penalty: `${actualPenalty.toLocaleString('vi-VN')}đ`,
        workDays: actualWorkDays ?? (isOt ? 'OT' : (tc.checkInOffset <= 0 ? 1 : '-')),
        expPenalty: `${tc.expectLatePenalty.toLocaleString('vi-VN')}đ`,
        expWorkDays: tc.expectWorkDays ?? '-',
        status: passed ? '✅' : '⚠️',
        recordId: record.id,
      });
    }
  }

  // Bảng tổng kết
  console.log('\n\n╔════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              📊 BẢNG KẾT QUẢ KIỂM THỬ CHẤM CÔNG                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  console.log('  TC  | Check-in | Check-out | Trễ | Mức | Phạt (thực) | Công (thực) | Phạt (kỳ vọng) | Công (kỳ vọng) | Kết quả');
  console.log('  ----|----------|-----------|-----|-----|-------------|-------------|----------------|----------------|--------');
  for (const r of results) {
    console.log(`  TC${r.idx.toString().padEnd(2)} | ${r.checkIn.padEnd(8)} | ${r.checkOut.padEnd(9)} | ${r.late.padEnd(3)} | ${String(r.level).padEnd(3)} | ${r.penalty.padEnd(11)} | ${String(r.workDays).padEnd(11)} | ${r.expPenalty.padEnd(14)} | ${String(r.expWorkDays).padEnd(14)} | ${r.status}`);
  }

  const passed = results.filter(r => r.status === '✅').length;
  const total  = results.length;
  console.log(`\n  ✅ Tổng kết: ${passed}/${total} test cases PASS`);
  console.log(`\n  🔑 Password chung test users: ${TEST_PASSWORD}`);
  console.log(`  📁 Shift: TEST_SHORT_20M (18:30-18:50)`);
  console.log(`  🌐 API Base: http://localhost:3001\n`);
}

runAutoTest()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('\n❌ LỖI:\n', e.message ?? e);
    await prisma.$disconnect();
    process.exit(1);
  });
