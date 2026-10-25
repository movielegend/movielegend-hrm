const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { userCode: 'NV000026' },
        { email: 'nam95218@gmail.com' }
      ]
    },
    include: { profile: true }
  });
  console.log('User found:', user?.id, user?.profile?.fullName, user?.email);
  if (!user) return;

  const tasks = await prisma.workTask.findMany({
    where: { userId: user.id },
    include: { updates: { orderBy: { createdAt: 'desc' } } }
  });
  console.log('\nTotal workTasks for user:', tasks.length);
  tasks.forEach(t => {
    const latestUpd = t.updates?.[0];
    console.log(`- [${t.taskCode}] id: ${t.id} | date: ${t.reportDate} | title: "${t.title}" | WT.approvalStatus: ${t.approvalStatus} | Upd.approvalStatus: ${latestUpd?.approvalStatus}`);
  });

  const assignedTasks = await prisma.task.findMany({
    where: {
      assignments: {
        some: { userId: user.id }
      }
    }
  });
  console.log('\nTotal assigned Tasks for user (/tasks/me):', assignedTasks.length);
  assignedTasks.forEach(at => {
    console.log(`- [${at.taskCode || at.id}] title: "${at.title}" | status: ${at.status}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
