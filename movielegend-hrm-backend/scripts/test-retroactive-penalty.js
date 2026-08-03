const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./src/app.module');
const { LeaveService } = require('./src/modules/leave/leave.service');
const { PrismaService } = require('./src/modules/prisma/prisma.service');
const { LeaveRequestStatus } = require('@prisma/client');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const leaveService = app.get(LeaveService);

  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  // 1. Lấy user TEST_U05
  const user = await prisma.user.findFirst({
    where: { userCode: 'TEST_U05' },
    include: { departmentLinks: { where: { isPrimary: true } } }
  });
  const deptId = user.departmentLinks[0]?.departmentId;

  // 2. Tạo LeaveType
  let leaveType = await prisma.leaveType.findFirst({ where: { code: 'LATE_EXCUSE' } });

  // 3. Xoá request cũ, tạo Attendance Record giả định bị phạt (Trễ mức 2)
  await prisma.leaveRequest.deleteMany({
    where: { userId: user.id, startDate: { lte: TODAY }, endDate: { gte: TODAY } }
  });

  const record = await prisma.attendanceRecord.findFirst({ where: { userId: user.id, workDate: TODAY } });
  if (record) {
    await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        lateMinutes: 5,
        latePenaltyLevel: 2,
        latePenaltyAmount: 80000,
        latePenaltyWorkDays: 1,
      }
    });
    console.log(`✅ [1] Đã tạo bảng công bị phạt Mức 2 (80,000đ) do chưa có đơn duyệt.`);
  }

  // 4. Tạo LeaveRequest PENDING
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      departmentId: deptId,
      leaveTypeId: leaveType.id,
      startDate: TODAY,
      endDate: TODAY,
      totalDays: 0.5,
      reason: '[AUTO-TEST] Đơn xin phép hồi tố',
      status: LeaveRequestStatus.PENDING,
    }
  });
  console.log(`✅ [2] Người dùng nộp đơn xin phép (PENDING) -> Bảng công VẪN BỊ PHẠT.`);

  // 5. Admin/Leader duyệt đơn (Sử dụng user làm actor luôn cho lẹ)
  console.log(`✅ [3] Leader tiến hành DUYỆT ĐƠN...`);
  await leaveService.approveLeave(leaveRequest.id, { userId: user.id, permissions: [] });

  // 6. Kiểm tra lại bảng công
  const finalRecord = await prisma.attendanceRecord.findFirst({ where: { id: record.id } });
  console.log(`\n================ KẾT QUẢ SAU KHI DUYỆT ĐƠN ================`);
  console.log(`Mức phạt cũ: 2 | Số tiền cũ: 80,000đ`);
  console.log(`Mức phạt mới: ${finalRecord.latePenaltyLevel === null ? 'Đã tẩy trắng' : finalRecord.latePenaltyLevel}`);
  console.log(`Tiền phạt mới: ${finalRecord.latePenaltyAmount === null ? '0đ' : finalRecord.latePenaltyAmount + 'đ'}`);
  
  if (finalRecord.latePenaltyLevel === null) {
    console.log(`-> KẾT LUẬN: Đã tự động cập nhật tẩy trắng hồi tố thành công!`);
  } else {
    console.log(`-> KẾT LUẬN: LỖI! Chưa tẩy trắng được.`);
  }

  await app.close();
}
bootstrap();
