const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Soft-delete duplicate drafts of test tasks for lead
  const lead = await prisma.user.findFirst({ where: { email: 'binhphung82632@gmail.com' } });
  if (lead) {
    // Find draft tasks that have a matching submitted task
    const leadTasks = await prisma.workTask.findMany({
      where: { userId: lead.id, reportDate: '2026-10-23', isDeleted: false },
      include: { updates: true }
    });
    
    // Draft duplicates to delete
    const draftDuplicates = leadTasks.filter(t => {
      const isDraft = t.updates?.[0]?.isDraft;
      if (isDraft && ['test1', 'test12', 'test13', 'test14', 'test15', 'test6', 'test67', 'test68'].includes(t.title)) {
        return true;
      }
      if (t.title === 'Công việc mới' && !t.category) {
        return true;
      }
      return false;
    });

    console.log('Lead draft duplicates to soft-delete:', draftDuplicates.map(d => ({ taskCode: d.taskCode, title: d.title })));
    for (const d of draftDuplicates) {
      await prisma.workTask.update({
        where: { id: d.id },
        data: { isDeleted: true, deletedAt: new Date(), deleteReason: 'Dọn dẹp bản nháp trùng lặp do autosave' }
      });
    }
  }

  // 2. Soft-delete duplicate drafts of test tasks for employee Đoàn Nam Dương
  const emp = await prisma.user.findFirst({ where: { userCode: 'NV000026' } });
  if (emp) {
    const empTasks = await prisma.workTask.findMany({
      where: { userId: emp.id, reportDate: '2026-10-23', isDeleted: false },
      include: { updates: true }
    });

    // For hi, hii, hiii, hiiii and test1: keep only the latest one of each title, soft-delete earlier duplicates
    const seenTitles = new Set();
    const toDelete = [];
    // Sort descending by createdAt: latest first
    empTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    for (const t of empTasks) {
      if (['hi', 'hii', 'hiii', 'hiiii', 'test1', 'test 1'].includes(t.title)) {
        if (seenTitles.has(t.title)) {
          toDelete.push(t);
        } else {
          seenTitles.add(t.title);
        }
      } else if (t.title === 'Công việc mới' && t.approvalStatus !== 'REJECTED') {
        toDelete.push(t);
      }
    }

    console.log('Emp duplicates to soft-delete:', toDelete.map(d => ({ taskCode: d.taskCode, title: d.title })));
    for (const d of toDelete) {
      await prisma.workTask.update({
        where: { id: d.id },
        data: { isDeleted: true, deletedAt: new Date(), deleteReason: 'Dọn dẹp bản nháp trùng lặp do autosave' }
      });
    }
  }

  console.log('Cleanup finished successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
