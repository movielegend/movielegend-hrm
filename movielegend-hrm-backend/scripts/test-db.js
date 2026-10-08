const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.user.count();
    console.log('Successfully connected to DB! Total users:', count);
  } catch (err) {
    console.error('DB connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
