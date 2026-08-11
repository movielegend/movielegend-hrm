const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const result = {};

  const totalGroups = await prisma.chatGroup.count();
  const totalMessages = await prisma.chatMessage.count();
  const totalMembers = await prisma.chatGroupMember.count();

  result.summary = { totalGroups, totalMembers, totalMessages };

  const groups = await prisma.chatGroup.findMany({
    include: {
      department: { select: { id: true, name: true, code: true } },
      task: { select: { id: true, title: true } },
      members: {
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
      },
      messages: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true } }
            }
          }
        }
      }
    }
  });

  result.groups = groups.map(g => ({
    id: g.id,
    name: g.name || (g.department ? 'Phòng ' + g.department.name : g.task ? 'Task ' + g.task.title : 'Chưa đặt tên'),
    type: g.type,
    department: g.department,
    task: g.task,
    memberCount: g.members.length,
    members: g.members.map(m => ({
      userId: m.userId,
      userCode: m.user.userCode,
      email: m.user.email,
      fullName: m.user.profile?.fullName || 'N/A'
    })),
    recentMessagesCount: g.messages.length,
    recentMessages: g.messages.map(msg => ({
      id: msg.id,
      sender: msg.sender?.profile?.fullName || msg.sender?.userCode || 'System',
      content: msg.content,
      fileUrl: msg.fileUrl,
      createdAt: msg.createdAt
    }))
  }));

  const sampleUsers = await prisma.user.findMany({
    take: 10,
    select: {
      id: true,
      userCode: true,
      email: true,
      profile: { select: { fullName: true } },
      roles: { include: { role: true } }
    }
  });

  result.sampleUsers = sampleUsers.map(u => ({
    id: u.id,
    userCode: u.userCode,
    email: u.email,
    fullName: u.profile?.fullName || 'N/A',
    roles: u.roles.map(r => r.role.name)
  }));

  fs.writeFileSync('chat_db_result.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log("Exported chat_db_result.json successfully!");
}

main().finally(() => prisma.$disconnect());
