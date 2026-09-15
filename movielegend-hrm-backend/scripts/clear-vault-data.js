require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- ĐANG TIẾN HÀNH XÓA DỮ LIỆU TÍNH NĂNG VÍ THƯỞNG ---');

  // 1. Delete Grant Milestones
  const deletedGrantMilestones = await prisma.grantMilestone.deleteMany({});
  console.log(`✓ Đã xóa ${deletedGrantMilestones.count} mốc mở thưởng (grant_milestones)`);

  // 2. Delete Project Grant Packages
  const deletedPackages = await prisma.projectGrantPackage.deleteMany({});
  console.log(`✓ Đã xóa ${deletedPackages.count} gói thưởng (project_grant_packages)`);

  // 3. Delete Vesting Milestones (Legacy)
  const deletedLegacyMilestones = await prisma.vestingMilestone.deleteMany({});
  console.log(`✓ Đã xóa ${deletedLegacyMilestones.count} mốc quý cũ (vesting_milestones)`);

  // 4. Delete Vault Transactions
  const deletedTransactions = await prisma.vaultTransaction.deleteMany({});
  console.log(`✓ Đã xóa ${deletedTransactions.count} lịch sử giao dịch ví (vault_transactions)`);

  // 5. Delete Reward Withdrawal Requests
  const deletedRequests = await prisma.rewardWithdrawalRequest.deleteMany({});
  console.log(`✓ Đã xóa ${deletedRequests.count} yêu cầu rút thưởng (reward_withdrawal_requests)`);

  // 6. Delete Talent Retention Vaults
  const deletedVaults = await prisma.talentRetentionVault.deleteMany({});
  console.log(`✓ Đã xóa ${deletedVaults.count} ví thưởng (talent_retention_vaults)`);

  console.log('--- HOÀN TẤT XÓA TOÀN BỘ DỮ LIỆU VÍ THƯỞNG SẠCH SẼ 100% ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi xóa dữ liệu ví thưởng:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
