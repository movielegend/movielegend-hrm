import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.faceProfile.findMany({
    include: { user: true, images: true }
  });
  
  console.log("Current Face Profiles:");
  profiles.forEach(p => {
    console.log(`User ID: ${p.userId}, Status: ${p.status}, Images: ${p.images.length}`);
  });
  
  // Auto fix all to APPROVED
  const updateResult = await prisma.faceProfile.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'APPROVED' }
  });
  
  console.log(`Fixed ${updateResult.count} pending profiles to APPROVED.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
