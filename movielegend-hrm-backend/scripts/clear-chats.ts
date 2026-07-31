import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearChats() {
  try {
    const deletedMessages = await prisma.chatMessage.deleteMany({});
    console.log(`Deleted ${deletedMessages.count} messages.`);
    
    const deletedMembers = await prisma.chatGroupMember.deleteMany({});
    console.log(`Deleted ${deletedMembers.count} group members.`);
    
    const deletedGroups = await prisma.chatGroup.deleteMany({});
    console.log(`Deleted ${deletedGroups.count} chat groups.`);
    
    console.log('All chats cleared successfully!');
  } catch (error) {
    console.error('Error clearing chats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearChats();
