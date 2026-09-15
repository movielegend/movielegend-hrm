require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  console.log('=== DANH SÁCH TẤT CẢ CÁC GÓI THƯỞNG ĐANG CÓ TRONG HỆ THỐNG ===\n');

  const vaults = await prisma.talentRetentionVault.findMany({
    include: {
      user: {
        include: {
          profile: true,
          departmentLinks: {
            where: { leftAt: null },
            include: { department: true },
          },
        },
      },
      packages: {
        include: {
          milestones: {
            orderBy: { milestoneIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      milestones: {
        orderBy: { quarter: 'asc' },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (vaults.length === 0) {
    console.log('Hiện tại chưa có dữ liệu ví thưởng nào trong cơ sở dữ liệu (Database đang trống).');
    return;
  }

  console.log(`Tìm thấy tổng cộng ${vaults.length} nhân sự có Ví Thưởng:\n`);

  vaults.forEach((v, vIdx) => {
    const user = v.user;
    const name = user.profile?.fullName || 'Chưa đặt tên';
    const code = user.userCode || user.id;
    const dept = user.departmentLinks?.[0]?.department?.name || 'Chưa phân phòng';
    const cashRate = Number(v.cashValuePerPoint || 1000);

    console.log(`----------------------------------------------------------------`);
    console.log(`👤 [${vIdx + 1}] Nhân viên: ${name} (${code}) - Phòng ban: ${dept}`);
    console.log(`   • ID Người dùng: ${user.id}`);
    console.log(`   • Trạng thái Quyền Ví: ${user.isRewardVaultEnabled ? '🟢 ĐÃ BẬT' : '🔴 ĐANG TẮT'}`);
    console.log(`   • Năm ví: ${v.year}`);
    console.log(`   • Tổng điểm cam kết (grantedPoints): ${v.grantedPoints.toLocaleString('vi-VN')} điểm (~${(v.grantedPoints * cashRate).toLocaleString('vi-VN')} VNĐ)`);
    console.log(`   • Điểm thưởng nóng (instantBonusPoints): ${v.instantBonusPoints.toLocaleString('vi-VN')} điểm (~${(v.instantBonusPoints * cashRate).toLocaleString('vi-VN')} VNĐ)`);
    console.log(`   • Tỷ giá quy đổi: 1 điểm = ${cashRate.toLocaleString('vi-VN')} VNĐ`);
    console.log(`   • Số gói thưởng độc lập (packages): ${v.packages.length} gói`);

    if (v.packages.length > 0) {
      console.log(`\n   📦 CHI TIẾT CÁC GÓI THƯỞNG:`);
      v.packages.forEach((pkg, pIdx) => {
        const pkgCash = pkg.totalPoints * Number(pkg.cashValuePerPoint || cashRate);
        console.log(`      ----------------------------------------------------------`);
        console.log(`      [Gói ${pIdx + 1}]: "${pkg.title}"`);
        console.log(`      • Tổng điểm gói: ${pkg.totalPoints.toLocaleString('vi-VN')} điểm (~${pkgCash.toLocaleString('vi-VN')} VNĐ)`);
        console.log(`      • Thời hạn: ${pkg.durationMonths} tháng | Chu kỳ mở: ${pkg.intervalMonths} tháng/đợt`);
        console.log(`      • Ngày bắt đầu: ${pkg.startDate ? new Date(pkg.startDate).toISOString().slice(0, 10) : 'N/A'}`);
        console.log(`      • Trạng thái gói: ${pkg.status}`);
        console.log(`      • Ghi chú: ${pkg.note || 'Không có'}`);
        console.log(`      • Các đợt mở khóa (${pkg.milestones.length} đợt):`);

        const now = new Date();
        pkg.milestones.forEach((m) => {
          const unlock = new Date(m.unlockDate);
          const isPassed = unlock <= now;
          const unlockStr = `${unlock.getDate().toString().padStart(2, '0')}/${(unlock.getMonth() + 1).toString().padStart(2, '0')}/${unlock.getFullYear()}`;
          const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
          const statusStr = m.isWithdrawn
            ? '🔴 ĐÃ RÚT HẾT'
            : isPassed
            ? '🟢 ĐÃ MỞ KHÓA (Khả dụng)'
            : '⏳ ĐANG KHÓA (Chờ đến ngày)';

          console.log(`         - Đợt ${m.milestoneIndex}: "${m.title}"`);
          console.log(`           + Ngày mở: ${unlockStr} [${statusStr}]`);
          console.log(`           + Điểm mở: ${m.pointsToUnlock.toLocaleString('vi-VN')} đ (~${Number(m.cashAmount).toLocaleString('vi-VN')} VNĐ)`);
          console.log(`           + Đã rút: ${m.withdrawnPoints.toLocaleString('vi-VN')} đ | Còn lại: ${remaining.toLocaleString('vi-VN')} đ`);
        });
      });
    }

    if (v.milestones.length > 0) {
      console.log(`\n   🏛️ CHI TIẾT CÁC QUÝ CỐ ĐỊNH CỦA NĂM (${v.milestones.length} quý):`);
      v.milestones.forEach((qm) => {
        const unlock = new Date(qm.unlockDate);
        const isPassed = unlock <= new Date();
        const unlockStr = `${unlock.getDate().toString().padStart(2, '0')}/${(unlock.getMonth() + 1).toString().padStart(2, '0')}/${unlock.getFullYear()}`;
        console.log(`      - Quý ${qm.quarter} (Mở: ${unlockStr}): ${qm.pointsToUnlock.toLocaleString('vi-VN')} điểm (~${Number(qm.cashAmount).toLocaleString('vi-VN')} VNĐ) [${qm.isWithdrawn ? 'Đã rút' : isPassed ? 'Khả dụng' : 'Khóa'}]`);
      });
    }
  });

  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
