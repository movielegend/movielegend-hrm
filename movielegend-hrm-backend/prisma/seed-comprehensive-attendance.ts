import { 
  PrismaClient, 
  AttendanceStatus, 
  ShiftAssignmentStatus, 
  AttendanceVerificationType, 
  LeaveRequestStatus 
} from '@prisma/client';

const prisma = new PrismaClient();

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
      // Gán tạm vào object
      user.departmentLinks = [{ departmentId: defaultDept.id, isPrimary: true } as any];
      console.log(`Đã gán phòng ban mặc định cho ${user.userCode} (${user.profile?.fullName || user.phone})`);
    }
  }

  // 4. Xóa dữ liệu phân ca và chấm công cũ trong dải ngày từ 01/10/2026 đến 13/10/2026
  const fromDate = new Date(2026, 9, 1); // 01/10/2026
  const toDate = new Date(2026, 9, 13); // 13/10/2026

  console.log('Đang dọn dẹp dữ liệu chấm công cũ trong tháng 10/2026...');
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
    const workDate = new Date(2026, 9, day);
    const dayOfWeek = workDate.getDay(); // 0: Chủ nhật, 6: Thứ 7
    const isToday = day === 13;

    // Chủ nhật (04/10 và 11/10) đa số nghỉ, chỉ 3 nhân viên trực ca
    const isSunday = dayOfWeek === 0;

    for (let uIdx = 0; uIdx < activeUsers.length; uIdx++) {
      const user = activeUsers[uIdx];
      const deptId = user.departmentLinks[0]?.departmentId || defaultDept.id;

      // Chủ nhật: chỉ 20% nhân sự trực, còn lại nghỉ ca
      if (isSunday && uIdx % 4 !== 0) {
        continue;
      }

      // Chọn ca làm việc: Phòng Live / CSKH có thể xoay ca Sáng/Chiều, còn lại Ca Hành chính
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

      // Phân bổ kịch bản theo yêu cầu: "mọi trường hợp chấm công, nhưng chấm đủ vẫn chiếm nhiều"
      // Xác định ngẫu nhiên dựa trên (uIdx * 17 + day * 31) để có tính đa dạng nhưng ổn định
      const seedVal = (uIdx * 17 + day * 31) % 100;

      if (isToday) {
        // === HÔM NAY (13/10/2026) - ĐANG DIỄN RA ===
        if (seedVal < 70) {
          // 70%: Chấm đủ/đúng giờ vào ca buổi sáng, hiện đang làm việc (CHECKED_IN)
          const inTime = new Date(workDate);
          inTime.setHours(startH - 1, 50 + (uIdx % 9), 0, 0); // Ví dụ 07:50 - 07:58

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
              notes: 'Đã check-in đúng giờ ca sáng',
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
        } else if (seedVal < 82) {
          // 12%: Đi muộn hôm nay
          const inTime = new Date(workDate);
          const lateMins = 15 + (uIdx % 25);
          inTime.setHours(startH, startM + lateMins, 0, 0);

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
              notes: `Đi muộn ${lateMins} phút do kẹt xe`,
            },
          });
          await prisma.attendanceVerification.create({
            data: {
              attendanceRecordId: record.id,
              type: AttendanceVerificationType.FACE,
              success: true,
              score: 0.972,
            },
          });
          totalLate++;
          totalTodayCheckedIn++;
        } else if (seedVal < 90) {
          // 8%: Ca chiều chưa vào ca (chưa check-in) hoặc Ca sáng đã hoàn thành checkout
          if (assignedShift.code === 'SANG') {
            const inTime = new Date(workDate);
            inTime.setHours(startH, startM, 0, 0);
            const outTime = new Date(workDate);
            outTime.setHours(endH, endM + 5, 0, 0);

            const record = await prisma.attendanceRecord.create({
              data: {
                userId: user.id,
                departmentId: deptId,
                shiftAssignmentId: assignment.id,
                workDate: workDate,
                checkInAt: inTime,
                checkOutAt: outTime,
                lateMinutes: 0,
                status: AttendanceStatus.CHECKED_OUT,
                notes: 'Hoàn thành ca sáng đúng giờ',
              },
            });
            totalOnTime++;
          } else {
            // Chưa tới giờ ca chiều
            totalAbsent++;
          }
        } else if (seedVal < 95 && annualLeave) {
          // 5%: Nghỉ phép hôm nay (đơn đã duyệt)
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
        } else {
          // 5%: Vắng mặt hôm nay
          totalAbsent++;
        }
      } else {
        // === CÁC NGÀY TRONG QUÁ KHỨ (01/10/2026 -> 12/10/2026) ===
        if (seedVal < 72) {
          // === TRƯỜNG HỢP 1: CHẤM ĐỦ, ĐÚNG GIỜ (CHIẾM ĐA SỐ ~72%) ===
          const inTime = new Date(workDate);
          inTime.setHours(startH - 1, 50 + (uIdx % 9), 0, 0); // Đến trước ca 1-10 phút

          const outTime = new Date(workDate);
          outTime.setHours(endH, endM + 5 + (uIdx % 15), 0, 0); // Về đúng giờ hoặc sau 5-20 phút

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
        } else if (seedVal < 83) {
          // === TRƯỜNG HỢP 2: ĐI MUỘN (LATE) (~11%) ===
          const lateMins = 16 + (uIdx % 30);
          const inTime = new Date(workDate);
          inTime.setHours(startH, startM + lateMins, 0, 0);

          const outTime = new Date(workDate);
          outTime.setHours(endH, endM + 15, 0, 0); // Về muộn hơn chút

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
        } else if (seedVal < 89) {
          // === TRƯỜNG HỢP 3: VỀ SỚM (EARLY_LEAVE) (~6%) ===
          const inTime = new Date(workDate);
          inTime.setHours(startH - 1, 55, 0, 0);

          const outTime = new Date(workDate);
          outTime.setHours(endH - 1, 15 + (uIdx % 20), 0, 0); // Về sớm 25-45 phút

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
              notes: 'Về sớm 45 phút có báo cáo Leader',
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
        } else if (seedVal < 94) {
          // === TRƯỜNG HỢP 4: THIẾU CHẤM / QUÊN CHECK-OUT (MISSING) (~5%) ===
          const inTime = new Date(workDate);
          inTime.setHours(startH - 1, 56, 0, 0);

          const record = await prisma.attendanceRecord.create({
            data: {
              userId: user.id,
              departmentId: deptId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: inTime,
              checkOutAt: null, // Quên check-out
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
        } else if (seedVal < 97 && annualLeave) {
          // === TRƯỜNG HỢP 5: NGHỈ PHÉP CÓ ĐƠN (LEAVE) (~3%) ===
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
        } else {
          // === TRƯỜNG HỢP 6: VẮNG MẶT (ABSENT) (~3%) ===
          // Có ca phân nhưng không chấm công
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
  console.log(`- Nhân viên đang check-in hôm nay: ${totalTodayCheckedIn}`);
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
