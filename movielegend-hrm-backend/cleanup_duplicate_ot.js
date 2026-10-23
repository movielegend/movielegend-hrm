// Script dọn dẹp các đơn OT thường (OvertimeRequest) bị tạo trùng khi nộp OT Live
// Chạy trên server: node cleanup_duplicate_ot.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('=== BẮT ĐẦU DỌN DẸP ĐƠN OT THƯỜNG BỊ TRÙNG ===');

  // 1. Tìm nhân viên theo mã NV000017 (hoặc tên Diệp)
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { userCode: 'NV000017' },
        { profile: { fullName: { contains: 'Diệp', mode: 'insensitive' } } }
      ]
    },
    include: { profile: true }
  });

  if (users.length === 0) {
    console.log('Không tìm thấy nhân viên với mã NV000017.');
    return;
  }

  for (const user of users) {
    console.log(`\nĐang kiểm tra nhân viên: ${user.profile?.fullName || ''} (${user.userCode}) [ID: ${user.id}]`);

    // 2. Tìm tất cả các báo cáo OT Live (OtReport) của nhân viên này
    const liveOtReports = await prisma.otReport.findMany({
      where: { userId: user.id }
    });

    console.log(`- Tìm thấy ${liveOtReports.length} đơn OT Live (OtReport).`);

    // 3. Tìm tất cả các đơn OT thường (OvertimeRequest) của nhân viên này
    const normalOts = await prisma.overtimeRequest.findMany({
      where: { userId: user.id }
    });

    console.log(`- Tìm thấy ${normalOts.length} đơn OT thường (OvertimeRequest).`);

    // 4. Lọc ra các đơn OT thường bị trùng do hệ thống tự sinh
    // Các đơn có lý do trùng khớp với đơn OT Live hoặc có từ khóa phiên live
    const toDeleteIds = [];

    for (const normal of normalOts) {
      const normalReason = (normal.reason || '').trim().toLowerCase();
      
      const isDuplicate = liveOtReports.some(live => {
        const liveReason = (live.reason || '').trim().toLowerCase();
        // Trùng lý do hoặc trùng thời gian
        const sameReason = normalReason && liveReason && (normalReason === liveReason || normalReason.includes(liveReason) || liveReason.includes(normalReason));
        return sameReason;
      }) || normalReason.includes('live') || normalReason.includes('fill ca') || normalReason.includes('thiếu ca');

      if (isDuplicate) {
        toDeleteIds.push({
          id: normal.id,
          workDate: normal.workDate,
          reason: normal.reason
        });
      }
    }

    if (toDeleteIds.length === 0) {
      console.log('-> Không phát hiện đơn OT thường nào bị trùng cần xóa.');
    } else {
      console.log(`-> Phát hiện ${toDeleteIds.length} đơn OT thường bị trùng:`);
      for (const item of toDeleteIds) {
        console.log(`   + ID: ${item.id} | Ngày: ${item.workDate} | Lý do: "${item.reason}"`);
      }

      // Tiến hành xóa các bản ghi OvertimeRequest trùng
      const deleteResult = await prisma.overtimeRequest.deleteMany({
        where: {
          id: { in: toDeleteIds.map(x => x.id) }
        }
      });

      console.log(`=> ĐÃ XÓA THÀNH CÔNG ${deleteResult.count} ĐƠN OT THƯỜNG BỊ TRÙNG!`);
    }
  }

  console.log('\n=== HOÀN TẤT ===');
}

cleanup()
  .catch(err => {
    console.error('Lỗi khi dọn dẹp:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
