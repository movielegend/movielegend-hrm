const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function safeDelete(modelName, whereClause) {
  if (prisma[modelName] && typeof prisma[modelName].deleteMany === 'function') {
    try {
      await prisma[modelName].deleteMany(whereClause);
    } catch (e) {}
  }
}

async function safeUpdate(modelName, whereClause, dataClause) {
  if (prisma[modelName] && typeof prisma[modelName].updateMany === 'function') {
    try {
      await prisma[modelName].updateMany({ where: whereClause.where, data: dataClause.data });
    } catch (e) {}
  }
}

async function main() {
  console.log('1. Đang lọc danh sách tài khoản cần giữ lại (Admin 0900000000)...');

  const nonAdminUsers = await prisma.user.findMany({
    where: {
      phone: { notIn: ['0900000000'] }
    },
    select: { id: true, phone: true }
  });

  const nonAdminIds = nonAdminUsers.map(u => u.id);

  if (nonAdminIds.length === 0) {
    console.log('Không tìm thấy tài khoản demo/nhân viên nào cần xóa.');
    return;
  }

  console.log(`-> Tìm thấy ${nonAdminIds.length} tài khoản demo/nhân viên. Tiến hành xóa toàn bộ dữ liệu liên quan...`);

  // Gỡ tham chiếu leader/manager
  await safeUpdate('department', { where: { leaderUserId: { in: nonAdminIds } } }, { data: { leaderUserId: null } });
  await safeUpdate('warehouse', { where: { managerUserId: { in: nonAdminIds } } }, { data: { managerUserId: null } });

  // Xóa các bảng liên quan đến OTP Token, Session, Auth
  await safeDelete('otpToken', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('oTPToken', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('refreshSession', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('deviceToken', { where: { userId: { in: nonAdminIds } } });

  // Xóa điểm danh, ca làm, đơn từ, lương
  await safeDelete('attendanceLog', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('attendanceRecord', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('userShift', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('shiftAssignment', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('shiftRegistration', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('shiftSwap', { where: { OR: [{ requesterUserId: { in: nonAdminIds } }, { targetUserId: { in: nonAdminIds } }] } });

  await safeDelete('leaveBalance', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('leaveRequest', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('overtimeRequest', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('employeeRequest', { where: { userId: { in: nonAdminIds } } });

  await safeDelete('payroll', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('payrollRecord', { where: { userId: { in: nonAdminIds } } });

  await safeDelete('notificationTarget', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('notificationDelivery', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('notification', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('auditLog', { where: { OR: [{ userId: { in: nonAdminIds } }, { actorUserId: { in: nonAdminIds } }] } });

  await safeDelete('chatGroupMember', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('chatMessage', { where: { senderId: { in: nonAdminIds } } });

  await safeDelete('employeeProfile', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('profile', { where: { userId: { in: nonAdminIds } } });
  await safeDelete('userRole', { where: { userId: { in: nonAdminIds } } });

  // Xóa dọn bằng raw SQL cấp thấp các bảng khóa ngoại còn sót nếu có
  const idsStr = nonAdminIds.map(id => `'${id}'`).join(',');
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "otp_tokens" WHERE "user_id" IN (${idsStr})`);
  } catch (e) {}
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "OtpToken" WHERE "userId" IN (${idsStr})`);
  } catch (e) {}

  // Xóa tài khoản user
  const deleteResult = await prisma.user.deleteMany({
    where: { id: { in: nonAdminIds } }
  });

  console.log(`✅ Đã xóa thành công ${deleteResult.count} tài khoản demo/nhân viên!`);
  console.log('🎉 Hoàn tất! Hệ thống hiện tại chỉ giữ lại duy nhất tài khoản Admin (0900000000).');
}

main()
  .catch((e) => {
    console.error('Lỗi khi xóa tài khoản:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
