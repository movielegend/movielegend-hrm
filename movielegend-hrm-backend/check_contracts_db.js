const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContracts() {
  try {
    const totalContracts = await prisma.employeeContract.count();
    console.log(`=== TỔNG SỐ HỢP ĐỒNG TRONG DB: ${totalContracts} ===`);

    if (totalContracts > 0) {
      const contracts = await prisma.employeeContract.findMany({
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              email: true,
              profile: { select: { fullName: true } }
            }
          }
        }
      });
      contracts.forEach((c, idx) => {
        console.log(`${idx + 1}. [${c.contractCode}] ${c.title}`);
        console.log(`   Giao cho User: ${c.user?.profile?.fullName || c.user?.userCode || c.userId}`);
        console.log(`   Trạng thái: ${c.status} | Tạo ngày: ${c.createdAt}`);
      });
    } else {
      console.log("Hiện tại trong CSDL chưa có hợp đồng nào được tạo!");
    }
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkContracts();
