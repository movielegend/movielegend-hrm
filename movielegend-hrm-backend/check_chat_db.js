const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChatData() {
  try {
    const groupCount = await prisma.chatGroup.count();
    const memberCount = await prisma.chatGroupMember.count();
    const messageCount = await prisma.chatMessage.count();

    console.log("=== THỐNG KÊ TỔNG QUAN CHAT ===");
    console.log(`- Số lượng nhóm chat (ChatGroup): ${groupCount}`);
    console.log(`- Số lượng thành viên nhóm (ChatGroupMember): ${memberCount}`);
    console.log(`- Số lượng tin nhắn (ChatMessage): ${messageCount}`);

    const groups = await prisma.chatGroup.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } },
        task: { select: { title: true } },
        _count: {
          select: { members: true, messages: true }
        }
      }
    });

    console.log("\n=== DANH SÁCH 10 NHÓM CHAT MỚI NHẤT ===");
    groups.forEach((g, i) => {
      console.log(`${i + 1}. [${g.type}] ID: ${g.id}`);
      console.log(`   Tên nhóm: ${g.name || (g.department ? 'Phòng ' + g.department.name : g.task ? 'Task ' + g.task.title : 'N/A')}`);
      console.log(`   Số thành viên: ${g._count.members} | Số tin nhắn: ${g._count.messages}`);
      console.log(`   Ngày tạo: ${g.createdAt}`);
    });

  } catch (err) {
    console.error("Lỗi khi truy vấn cơ sở dữ liệu:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkChatData();
