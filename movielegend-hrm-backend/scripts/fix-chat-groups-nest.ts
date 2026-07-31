import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const res = await prisma.chatGroup.updateMany({
    where: { departmentId: { not: null }, type: 'CUSTOM' },
    data: { type: 'DEPARTMENT' }
  });
  
  console.log(`Updated ${res.count} groups.`);
  await app.close();
}
bootstrap().catch(console.error);
