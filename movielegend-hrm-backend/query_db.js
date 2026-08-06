const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== FEEDBACKS QUERY ===");
  const feedbacks = await prisma.feedback.findMany({
    include: {
      sender: {
        include: {
          profile: true
        }
      }
    }
  });
  console.log("Total Feedbacks:", feedbacks.length);
  feedbacks.forEach((f, idx) => {
    console.log(`Feedback #${idx + 1}:`);
    console.log(`  ID: ${f.id}`);
    console.log(`  Title: ${f.title}`);
    console.log(`  Content: ${f.content}`);
    console.log(`  Sender: ${f.isAnonymous ? 'Nặc danh' : (f.sender?.profile?.fullName || f.sender?.email || 'N/A')}`);
    console.log(`  Status: ${f.status}`);
    console.log(`  Created At: ${f.createdAt}`);
  });
}

main().finally(() => prisma.$disconnect());
