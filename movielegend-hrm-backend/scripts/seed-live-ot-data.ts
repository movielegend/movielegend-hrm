import { PrismaClient, AttendanceStatus, OtReportStatus, UploadPurpose, UploadedFileStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING LIVE ATTENDANCE & OT DATA ===\n');

  // 1. Tìm hoặc tạo Phòng Live
  let liveDept = await prisma.department.findFirst({
    where: {
      OR: [
        { name: { contains: 'Live', mode: 'insensitive' } },
        { code: { contains: 'LIVE', mode: 'insensitive' } },
      ],
    },
  });

  if (!liveDept) {
    const comp = await prisma.company.findFirst();
    const branch = await prisma.branch.findFirst();
    if (!comp || !branch) {
      throw new Error('Cần có Company và Branch trước');
    }
    liveDept = await prisma.department.create({
      data: {
        companyId: comp.id,
        branchId: branch.id,
        name: 'Phòng Live',
        code: 'DEPT_LIVE',
        description: 'Đội ngũ Streamer, KOC live bán hàng',
      },
    });
    console.log('Tạo mới Phòng Live:', liveDept.id);
  } else {
    console.log('Đã có Phòng Live:', liveDept.id, liveDept.name);
  }

  // 2. Lấy danh sách users
  const adminUser = await prisma.user.findFirst({
    where: { phone: '0900000000' },
  });
  const staffUser = await prisma.user.findFirst({
    where: { email: 'binhpthe173173@fpt.edu.vn' },
  }) || await prisma.user.findFirst({
    where: { phone: '0961416137' },
  });

  if (!staffUser) {
    throw new Error('Không tìm thấy nhân viên');
  }

  console.log('Admin/Leader:', adminUser?.phone, adminUser?.email);
  console.log('Staff User:', staffUser.phone, staffUser.email);

  // Đảm bảo staffUser thuộc Phòng Live
  await prisma.departmentMember.upsert({
    where: {
      departmentId_userId: {
        departmentId: liveDept.id,
        userId: staffUser.id,
      },
    },
    update: { isPrimary: true },
    create: {
      departmentId: liveDept.id,
      userId: staffUser.id,
      isPrimary: true,
    },
  });

  // Nếu có admin, gán làm Leader phòng Live
  if (adminUser) {
    await prisma.department.update({
      where: { id: liveDept.id },
      data: { leaderUserId: adminUser.id },
    });
  }

  // 3. Tạo một số file ảnh mẫu (UploadedFile) cho OT Report
  const samplePhoto1 = await prisma.uploadedFile.create({
    data: {
      uploadedById: staffUser.id,
      purpose: UploadPurpose.OT_REPORT_ATTACHMENT,
      fileName: 'live_stream_proof_1.jpg',
      storageKey: `ot-proofs/sample-1-${Date.now()}.jpg`,
      fileUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fdd53?w=800',
      mimeType: 'image/jpeg',
      size: 102400,
      status: UploadedFileStatus.ATTACHED,
    },
  });

  const samplePhoto2 = await prisma.uploadedFile.create({
    data: {
      uploadedById: staffUser.id,
      purpose: UploadPurpose.OT_REPORT_ATTACHMENT,
      fileName: 'live_stream_proof_2.jpg',
      storageKey: `ot-proofs/sample-2-${Date.now()}.jpg`,
      fileUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      mimeType: 'image/jpeg',
      size: 154200,
      status: UploadedFileStatus.ATTACHED,
    },
  });

  // 4. Xóa dữ liệu mẫu cũ của nhân viên này trong các ngày 04, 05, 06, 07 tháng 10 năm 2026 để nạp lại sạch sẽ
  const dates = [
    new Date('2026-10-04T00:00:00.000Z'),
    new Date('2026-10-05T00:00:00.000Z'),
    new Date('2026-10-06T00:00:00.000Z'),
    new Date('2026-10-07T00:00:00.000Z'),
  ];

  await prisma.otReport.deleteMany({
    where: {
      userId: staffUser.id,
      otDate: { in: dates },
    },
  });

  await prisma.attendanceRecord.deleteMany({
    where: {
      userId: staffUser.id,
      workDate: { in: dates },
    },
  });

  console.log('Đã dọn dẹp dữ liệu cũ cho các ngày 04/10 đến 07/10');

  // ==========================================
  // NGÀY 04/10/2026: 1 ca 2 giờ (Chưa đủ 5h, 0 OT)
  // ==========================================
  await prisma.attendanceRecord.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      workDate: new Date('2026-10-04T00:00:00.000Z'),
      checkInAt: new Date('2026-10-04T08:00:00.000Z'),
      checkOutAt: new Date('2026-10-04T10:00:00.000Z'),
      status: AttendanceStatus.CHECKED_OUT,
    },
  });
  console.log('Đã tạo ngày 04/10: 1 lượt làm 2:00');

  // ==========================================
  // NGÀY 05/10/2026: 2 ca tổng 6 giờ -> 1h OT (Đã duyệt 150%)
  // Ca 1: 08:00 - 12:00 (4h)
  // Ca 2: 18:00 - 20:00 (2h) -> mốc 5h đạt lúc 19:00
  // ==========================================
  await prisma.attendanceRecord.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      workDate: new Date('2026-10-05T00:00:00.000Z'),
      checkInAt: new Date('2026-10-05T08:00:00.000Z'),
      checkOutAt: new Date('2026-10-05T12:00:00.000Z'),
      status: AttendanceStatus.CHECKED_OUT,
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      workDate: new Date('2026-10-05T00:00:00.000Z'),
      checkInAt: new Date('2026-10-05T18:00:00.000Z'),
      checkOutAt: new Date('2026-10-05T20:00:00.000Z'),
      status: AttendanceStatus.CHECKED_OUT,
    },
  });

  // Báo cáo OT ngày 05/10 (Đã duyệt x150%)
  await prisma.otReport.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      otDate: new Date('2026-10-05T00:00:00.000Z'),
      startTime: new Date('2026-10-05T19:00:00.000Z'),
      endTime: new Date('2026-10-05T20:00:00.000Z'),
      proposedPercent: 150,
      approvedPercent: 150,
      reason: 'Live phiên tối ca đêm bán máy chiếu',
      status: OtReportStatus.APPROVED,
      validOtMinutes: 60,
      decidedByUserId: adminUser?.id,
      decidedAt: new Date('2026-10-06T08:00:00.000Z'),
      photos: {
        create: [{ fileId: samplePhoto1.id }],
      },
    },
  });
  console.log('Đã tạo ngày 05/10: 2 lượt làm 6:00, 1 Báo cáo OT ĐÃ DUYỆT (1:00 x150%)');

  // ==========================================
  // NGÀY 06/10/2026: ĐÚNG VÍ DỤ CỦA BẠN!
  // Lượt 1: 00h - 02h (2 giờ)
  // Lượt 2: 08h - 09h (1 giờ)
  // Lượt 3: 19h - 23h (4 giờ) -> 21h đạt mốc 5h
  // Báo cáo OT: 21h - 23h (2 giờ, PENDING Chờ duyệt)
  // ==========================================
  await prisma.attendanceRecord.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      workDate: new Date('2026-10-06T00:00:00.000Z'),
      checkInAt: new Date('2026-10-06T00:00:00.000Z'),
      checkOutAt: new Date('2026-10-06T02:00:00.000Z'),
      status: AttendanceStatus.CHECKED_OUT,
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      workDate: new Date('2026-10-06T00:00:00.000Z'),
      checkInAt: new Date('2026-10-06T08:00:00.000Z'),
      checkOutAt: new Date('2026-10-06T09:00:00.000Z'),
      status: AttendanceStatus.CHECKED_OUT,
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      workDate: new Date('2026-10-06T00:00:00.000Z'),
      checkInAt: new Date('2026-10-06T19:00:00.000Z'),
      checkOutAt: new Date('2026-10-06T23:00:00.000Z'),
      status: AttendanceStatus.CHECKED_OUT,
    },
  });

  // Báo cáo OT ngày 06/10 (Chờ duyệt PENDING - 2h)
  await prisma.otReport.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      otDate: new Date('2026-10-06T00:00:00.000Z'),
      startTime: new Date('2026-10-06T21:00:00.000Z'),
      endTime: new Date('2026-10-06T23:00:00.000Z'),
      proposedPercent: 100,
      reason: 'Ca live mở rộng theo chỉ đạo tăng doanh thu',
      status: OtReportStatus.PENDING,
      validOtMinutes: 120, // 2 giờ
      photos: {
        create: [{ fileId: samplePhoto1.id }, { fileId: samplePhoto2.id }],
      },
    },
  });
  console.log('Đã tạo ngày 06/10: 3 lượt làm 7:00, 1 Báo cáo OT CHỜ DUYỆT (2:00 x100%)');

  // ==========================================
  // NGÀY 07/10/2026 (HÔM NAY):
  // 1 lượt làm đã hoàn tất sáng nay (08:00 - 11:30 = 3.5h)
  // để nhân viên test check-in tiếp ca chiều và tạo báo cáo
  // ==========================================
  await prisma.attendanceRecord.create({
    data: {
      userId: staffUser.id,
      departmentId: liveDept.id,
      workDate: new Date('2026-10-07T00:00:00.000Z'),
      checkInAt: new Date('2026-10-07T08:00:00.000Z'),
      checkOutAt: new Date('2026-10-07T11:30:00.000Z'),
      status: AttendanceStatus.CHECKED_OUT,
    },
  });
  console.log('Đã tạo ngày 07/10 (Hôm nay): 1 lượt sáng (08:00 - 11:30, 3.5h) đã checkout sẵn sàng check-in ca mới');

  console.log('\n=== SEED COMPLETED SUCCESSFULLY! ===');
}

main()
  .catch((e) => {
    console.error('SEED ERROR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
