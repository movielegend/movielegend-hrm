import { 
  PrismaClient, 
  AttendanceStatus, 
  ShiftAssignmentStatus, 
  AttendanceVerificationType, 
  LeaveRequestStatus 
} from '@prisma/client';

const prisma = new PrismaClient();

// Hàm chuyển đổi giờ Việt Nam (UTC+7) sang Date UTC chuẩn xác
function makeVnTime(workDate: Date, hour: number, minute: number): Date {
  // workDate là Date.UTC(year, month, day, 0, 0, 0, 0)
  // 420 phút = 7 tiếng chênh lệch giữa VN và UTC
  const totalMinutesUtc = hour * 60 + minute - 420;
  return new Date(workDate.getTime() + totalMinutesUtc * 60_000);
}

async function main() {
  console.log('=== BẮT ĐẦU TẠO DỮ LIỆU CHẤM CÔNG TOÀN DIỆN CHO MỌI NHÂN VIÊN ===');

  // 1. Đảm bảo các Ca làm việc (Shifts) tồn tại
  const shiftsData = [
    { code: 'HC', name: 'Ca Hành Chính', startTime: '08:00', endTime: '17:00', breakMinutes: 60 },
    { code: 'SANG', name: 'Ca Sáng', startTime: '07:00', endTime: '15:30', breakMinutes: 30 },
    { code: 'CHIEU', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00', breakMinutes: 30 },
  ];

  const shifts: any[] = [];
  for (const s of shiftsData) {
    let shift = await prisma.shift.findUnique({ where: { code: s.code } });
    if (!shift) {
      shift = await prisma.shift.create({
        data: {
          code: s.code,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          breakMinutes: s.breakMinutes,
          checkInEarlyMinutes: 15,
          checkInLateMinutes: 15,
          checkOutEarlyMinutes: 0,
          checkOutLateMinutes: 30,
          isActive: true,
        },
      });
    }
    shifts.push(shift);
  }
  console.log(`Đã sẵn sàng ${shifts.length} ca làm việc (HC, SANG, CHIEU).`);

  // 2. Lấy phòng ban mặc định và loại nghỉ phép
  const defaultDept = await prisma.department.findFirst({
    where: { code: 'DEPT_HR' },
  }) || await prisma.department.findFirst();

  if (!defaultDept) {
    throw new Error('Không tìm thấy phòng ban nào trong hệ thống!');
  }

  const annualLeave = await prisma.leaveType.findFirst({
    where: { code: 'PHEP_NAM' },
  }) || await prisma.leaveType.findFirst();

  // 3. Lấy toàn bộ nhân viên ACTIVE
  const activeUsers = await prisma.user.findMany({
    where: { accountStatus: 'ACTIVE' },
    include: {
      profile: true,
      departmentLinks: {
        include: { department: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Tìm thấy ${activeUsers.length} nhân viên ACTIVE.`);

  // Đảm bảo tất cả nhân viên đều có ít nhất 1 phòng ban liên kết
  for (const user of activeUsers) {
    if (!user.departmentLinks || user.departmentLinks.length === 0) {
      await prisma.departmentMember.upsert({
        where: {
          departmentId_userId: {
            departmentId: defaultDept.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          departmentId: defaultDept.id,
          isPrimary: true,
        },
      });
      user.departmentLinks = [{ departmentId: defaultDept.id, isPrimary: true } as any];
      console.log(`Đã gán phòng ban mặc định cho ${user.userCode} (${user.profile?.fullName || user.phone})`);
    }
  }

  // 4. Xóa dữ liệu phân ca và chấm công cũ trong dải ngày từ 01/10/2026 đến 13/10/2026
  // Chú ý: Dùng Date.UTC để khớp chuẩn xác @db.Date của PostgreSQL
  const fromDate = new Date(Date.UTC(2026, 9, 1, 0, 0, 0, 0)); // 01/10/2026 UTC
  const toDate = new Date(Date.UTC(2026, 9, 13, 0, 0, 0, 0));   // 13/10/2026 UTC

  console.log('Đang dọn dẹp dữ liệu chấm công cũ trong tháng 10/2026 (01/10 -> 13/10)...');
  await prisma.attendanceVerification.deleteMany({
    where: {
      attendanceRecord: {
        workDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
    },
  });

  await prisma.attendanceRecord.deleteMany({
    where: {
      workDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
  });

  await prisma.shiftAssignment.deleteMany({
    where: {
      workDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
  });

  await prisma.leaveRequest.deleteMany({
    where: {
      startDate: { gte: fromDate },
      endDate: { lte: toDate },
      reason: { contains: 'Nghỉ' },
    },
  });

  // 5. Sinh dữ liệu từ ngày 01/10/2026 đến 13/10/2026
  const hcShift = shifts.find(s => s.code === 'HC') || shifts[0];
  const sangShift = shifts.find(s => s.code === 'SANG') || shifts[0];
  const chieuShift = shifts.find(s => s.code === 'CHIEU') || shifts[0];

  let totalAssignments = 0;
  let totalOnTime = 0;
  let totalLate = 0;
  let totalEarly = 0;
  let totalMissing = 0;
  let totalLeave = 0;
  let totalAbsent = 0;
  let totalTodayCheckedIn = 0;

  for (let day = 1; day <= 13; day++) {
    const workDate = new Date(Date.UTC(2026, 9, day, 0, 0, 0, 0));
    const dayOfWeek = workDate.getUTCDay(); // 0: Chủ nhật, 6: Thứ 7
    const isToday = day === 13;
    const isSunday = dayOfWeek === 0;

    for (let uIdx = 0; uIdx < activeUsers.length; uIdx++) {
      const user = activeUsers[uIdx];
      const deptId = user.departmentLinks[0]?.departmentId || defaultDept.id;

      // Chủ nhật (04/10 và 11/10): chỉ 25% nhân sự trực ca, còn lại nghỉ
      if (isSunday && uIdx % 4 !== 0) {
        continue;
      }

      // Chọn ca làm việc phù hợp:
      // Nhân viên Live / CSKH có thể xoay ca Sáng/Chiều, còn lại Ca Hành chính
      let assignedShift = hcShift;
      const deptName = user.departmentLinks[0]?.department?.name || '';
      if (deptName.includes('Live')) {
        assignedShift = uIdx % 2 === 0 ? sangShift : chieuShift;
      } else if (deptName.includes('CSKH')) {
        assignedShift = uIdx % 3 === 0 ? sangShift : (uIdx % 3 === 1 ? chieuShift : hcShift);
      }

      // Tạo ShiftAssignment
      const assignment = await prisma.shiftAssignment.create({
        data: {
          userId: user.id,
          departmentId: deptId,
          shiftId: assignedShift.id,
          workDate: workDate,
          status: ShiftAssignmentStatus.ASSIGNED,
        },
      });
      totalAssignments++;

      const [startH, startM] = assignedShift.startTime.split(':').map(Number);
      const [endH, endM] = assignedShift.endTime.split(':').map(Number);

      if (isToday) {
        // =========================================================================
        // HÔM NAY (13/10/2026) - Ngày hiện tại người dùng đang xem trên giao diện web
        // Toàn bộ 16 nhân viên:
        // - 11 nhân viên: Đúng giờ (chiếm ~70%)
        // - 2 nhân viên: Đi muộn (chiếm ~12%)
        // - 1 nhân viên: Ca sáng về sớm (chiếm ~6%)
        // - 1 nhân viên: Nghỉ phép có duyệt (chiếm ~6%)
        // - 1 nhân viên: Vắng mặt chưa đến (chiếm ~6%)
        // Tổng có mặt: 14/16, Vắng mặt: 2/16
        // =========================================================================

        if (uIdx <= 8) {
          // --- 9 Nhân viên: ĐÚNG GIỜ ca HC, check-in sáng nay (07:50 - 07:58), đang làm việc ---
          const inMinute = 50 + (uIdx % 8); // 07:50 -> 07:57
          const inTime = makeVnTime(workDate, startH - 1, inMinute);

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              lateMinutes: 0,
              status: AttendanceStatus.CHECKED_IN,
              notes: 'Check-in đúng giờ ca sáng',
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.985,
            },
          });
          totalOnTime++;
          totalTodayCheckedIn++;

        } else if (uIdx <= 10) {
          // --- 2 Nhân viên: Ca Sáng (07:00 - 15:30), đã hoàn thành ca đúng giờ (CHECKED_OUT) ---
          const inTime = makeVnTime(workDate, startH - 1, 52 + (uIdx % 5)); // 06:52 - 06:56
          const outTime = makeVnTime(workDate, endH, endM + 5); // 15:35

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkOutAt: outTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              checkOutLatitude: 10.7769,
              checkOutLongitude: 106.7009,
              lateMinutes: 0,
              status: AttendanceStatus.CHECKED_OUT,
              notes: 'Đã hoàn thành ca sáng đúng giờ',
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.99,
            },
          });
          totalOnTime++;
          totalTodayCheckedIn++;

        } else if (uIdx === 11) {
          // --- 1 Nhân viên: ĐI MUỘN 25 phút ---
          const lateMins = 25;
          const inTime = makeVnTime(workDate, startH, startM + lateMins); // 08:25

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              lateMinutes: lateMins,
              latePenaltyLevel: 1,
              status: AttendanceStatus.CHECKED_IN,
              notes: 'Đi muộn 25 phút do kẹt xe',
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.97,
            },
          });
          totalLate++;
          totalTodayCheckedIn++;

        } else if (uIdx === 12) {
          // --- 1 Nhân viên: ĐI MUỘN 18 phút ---
          const lateMins = 18;
          const inTime = makeVnTime(workDate, startH, startM + lateMins); // 08:18

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              lateMinutes: lateMins,
              latePenaltyLevel: 1,
              status: AttendanceStatus.CHECKED_IN,
              notes: 'Đi muộn 18 phút',
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.965,
            },
          });
          totalLate++;
          totalTodayCheckedIn++;

        } else if (uIdx === 13) {
          // --- 1 Nhân viên: VỀ SỚM ca Sáng (07:00 - 15:30, về lúc 15:00) ---
          const inTime = makeVnTime(workDate, startH - 1, 55); // 06:55
          const outTime = makeVnTime(workDate, endH - 1, 0);   // 14:30 hoặc 15:00 (về sớm 30 phút)

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkOutAt: outTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              checkOutLatitude: 10.7769,
              checkOutLongitude: 106.7009,
              lateMinutes: 0,
              status: AttendanceStatus.CHECKED_OUT,
              notes: 'Về sớm 30 phút có báo cáo Leader',
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.98,
            },
          });
          totalEarly++;
          totalTodayCheckedIn++;

        } else if (uIdx === 14 && annualLeave) {
          // --- 1 Nhân viên: NGHỈ PHÉP hôm nay có đơn duyệt ---
          await prisma.leaveRequest.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              leaveTypeId: annualLeave.id,
              startDate: workDate,
              endDate: workDate,
              totalDays: '1',
              reason: 'Nghỉ giải quyết việc gia đình',
              status: LeaveRequestStatus.APPROVED,
            },
          });
          totalLeave++;
          totalAbsent++;

        } else {
          // --- 1 Nhân viên: VẮNG MẶT hôm nay (chưa đến) ---
          totalAbsent++;
        }

      } else {
        // =========================================================================
        // CÁC NGÀY TRONG QUÁ KHỨ (01/10/2026 -> 12/10/2026)
        // Phân bổ kịch bản: Chấm đủ chiếm đa số (~72%), còn lại đi muộn, về sớm,
        // thiếu chấm, nghỉ phép, vắng mặt
        // =========================================================================
        const seedVal = (uIdx * 19 + day * 37) % 100;

        if (seedVal < 72) {
          // --- TRƯỜNG HỢP 1: CHẤM ĐỦ, ĐÚNG GIỜ (~72%) [CHIẾM ĐA SỐ] ---
          const inMinute = 50 + (uIdx % 9); // Đến trước ca 1-10 phút
          const inTime = makeVnTime(workDate, startH - 1, inMinute);
          const outTime = makeVnTime(workDate, endH, endM + 5 + (uIdx % 15)); // Về sau ca 5-20 phút

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkOutAt: outTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              checkOutLatitude: 10.7769,
              checkOutLongitude: 106.7009,
              lateMinutes: 0,
              status: AttendanceStatus.CHECKED_OUT,
              notes: 'Chấm công đủ ca, đúng giờ',
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.988,
            },
          });
          totalOnTime++;

        } else if (seedVal < 84) {
          // --- TRƯỜNG HỢP 2: ĐI MUỘN (LATE) (~12%) ---
          const lateMins = 16 + (uIdx % 25);
          const inTime = makeVnTime(workDate, startH, startM + lateMins);
          const outTime = makeVnTime(workDate, endH, endM + 15);

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkOutAt: outTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              checkOutLatitude: 10.7769,
              checkOutLongitude: 106.7009,
              lateMinutes: lateMins,
              latePenaltyLevel: 1,
              status: AttendanceStatus.CHECKED_OUT,
              notes: `Đi muộn ${lateMins} phút`,
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.965,
            },
          });
          totalLate++;

        } else if (seedVal < 90) {
          // --- TRƯỜNG HỢP 3: VỀ SỚM (EARLY) (~6%) ---
          const inTime = makeVnTime(workDate, startH - 1, 55);
          const earlyMins = 25 + (uIdx % 20);
          const outMinutesTotal = endH * 60 + endM - earlyMins;
          const outH = Math.floor(outMinutesTotal / 60);
          const outM = outMinutesTotal % 60;
          const outTime = makeVnTime(workDate, outH, outM);

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkOutAt: outTime,
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              checkOutLatitude: 10.7769,
              checkOutLongitude: 106.7009,
              lateMinutes: 0,
              status: AttendanceStatus.CHECKED_OUT,
              notes: `Về sớm ${earlyMins} phút có báo cáo Leader`,
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.98,
            },
          });
          totalEarly++;

        } else if (seedVal < 95) {
          // --- TRƯỜNG HỢP 4: THIẾU CHẤM / QUÊN CHECK-OUT (MISSING) (~5%) ---
          const inTime = makeVnTime(workDate, startH - 1, 56);

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkOutAt: null, // Quên checkout
              checkInLatitude: 10.7769,
              checkInLongitude: 106.7009,
              lateMinutes: 0,
              status: AttendanceStatus.MISSING,
              notes: 'Quên check-out sau khi kết thúc ca',
            },
          });

          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.99,
            },
          });
          totalMissing++;

        } else if (seedVal < 98 && annualLeave) {
          // --- TRƯỜNG HỢP 5: NGHỈ PHÉP CÓ ĐƠN (LEAVE) (~3%) ---
          await prisma.leaveRequest.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              leaveTypeId: annualLeave.id,
              startDate: workDate,
              endDate: workDate,
              totalDays: '1',
              reason: 'Nghỉ phép thường niên',
              status: LeaveRequestStatus.APPROVED,
            },
          });
          totalLeave++;
          totalAbsent++;

        } else {
          // --- TRƯỜNG HỢP 6: VẮNG MẶT (ABSENT) (~2%) ---
          totalAbsent++;
        }
      }
    }
  }

  console.log('\n=== KẾT QUẢ SINH DỮ LIỆU CHẤM CÔNG ===');
  console.log(`- Tổng số phân ca (ShiftAssignment): ${totalAssignments}`);
  console.log(`- Đúng giờ / Chấm đủ (ON_TIME): ${totalOnTime} (${Math.round(totalOnTime / totalAssignments * 100)}%) [CHIẾM ĐA SỐ]`);
  console.log(`- Đi muộn (LATE): ${totalLate} (${Math.round(totalLate / totalAssignments * 100)}%)`);
  console.log(`- Về sớm (EARLY): ${totalEarly} (${Math.round(totalEarly / totalAssignments * 100)}%)`);
  console.log(`- Thiếu chấm (MISSING): ${totalMissing} (${Math.round(totalMissing / totalAssignments * 100)}%)`);
  console.log(`- Nghỉ phép (LEAVE): ${totalLeave} (${Math.round(totalLeave / totalAssignments * 100)}%)`);
  console.log(`- Vắng mặt (ABSENT): ${totalAbsent} (${Math.round(totalAbsent / totalAssignments * 100)}%)`);
  console.log(`- Nhân viên có mặt hôm nay (13/10/2026): ${totalTodayCheckedIn}`);
  console.log('=== HOÀN TẤT THÀNH CÔNG ===');
}

main()
  .catch((e) => {
    console.error('Lỗi khi sinh dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
