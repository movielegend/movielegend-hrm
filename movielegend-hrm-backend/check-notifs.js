const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  const notifs = await prisma.notification.findMany();
  const targets = await prisma.notificationTarget.findMany();
  console.log(`Có ${notifs.length} notification trong DB.`);
  console.log(`Có ${targets.length} notification target trong DB.`);
  
  if (notifs.length > 0) {
    console.log('Sample Notification:', JSON.stringify(notifs[0], null, 2));
  }
}

checkNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
