const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserTest1() {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true
      }
    });

    console.log("=== DANH SÁCH TẤT CẢ USER TRONG DATABASE ===");
    console.log(`Tổng số user: ${users.length}`);
    users.forEach((u, index) => {
      console.log(`${index + 1}. Code: ${u.userCode} | Email: ${u.email} | Name: ${u.profile?.fullName || 'Chưa tạo profile'} | DeletedAt: ${u.deletedAt}`);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTest1();
