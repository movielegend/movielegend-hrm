const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = [
    '0900000001', '0900000002', '0900000003', '0900000004',
    '0900000005', '0900000006', '0900000007', '0900000008'
  ];

  const users = await prisma.user.findMany({
    where: { phone: { in: phones } },
    select: { id: true, phone: true }
  });

  if (users.length === 0) {
    console.log('Không tìm thấy tài khoản nào để xóa.');
    return;
  }

  const userIds = users.map(u => u.id);
  console.log(`Đã tìm thấy ${userIds.length} tài khoản. Bắt đầu xóa dữ liệu liên quan...`);

  try {
    // Xóa các bảng con liên quan trước (vì Prisma mặc định không có Cascade Delete ở cấp DB cho toàn bộ)
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.employeeProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.otpToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.faceProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.notificationTarget.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.deviceToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userNotificationPreference.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.refreshSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.departmentMember.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.chatGroupMember.deleteMany({ where: { userId: { in: userIds } } });

    // Cuối cùng xóa User
    const result = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    console.log(`Đã dọn dẹp sạch sẽ ${result.count} tài khoản thành công! Bạn có thể tạo lại từ đầu.`);
  } catch (error) {
    console.error('Lỗi khi xóa:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
