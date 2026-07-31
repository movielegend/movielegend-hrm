const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Delete group members first if needed, though cascade might handle it
    await prisma.chatGroupMember.deleteMany({
      where: { groupId: 'c384008e-bc73-4f2e-8823-04fc1d3d5787' }
    });
    await prisma.chatMessage.deleteMany({
      where: { groupId: 'c384008e-bc73-4f2e-8823-04fc1d3d5787' }
    });
    await prisma.chatGroup.delete({
      where: { id: 'c384008e-bc73-4f2e-8823-04fc1d3d5787' }
    });
    console.log('Successfully deleted the chat group');
  } catch (error) {
    console.error('Error deleting chat group:', error);
  }
}

main().finally(() => prisma.$disconnect());
