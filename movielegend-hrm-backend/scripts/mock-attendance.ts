import * as Module from 'module';
const originalRequire = (Module as any).prototype.require;
(Module as any).prototype.require = function (id: string) {
  if (id === '@tensorflow/tfjs-node') {
    return require('@tensorflow/tfjs');
  }
  return originalRequire.apply(this, arguments);
};

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/database/prisma.service';
import { AttendanceStatus } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignments = await prisma.shiftAssignment.findMany({
    where: { workDate: today },
    include: { user: { include: { profile: true } }, shift: true },
  });

  console.log(`Found ${assignments.length} assignments for today (${today.toISOString()})`);

  let count = 0;
  for (const assign of assignments) {
    if (!assign.departmentId) continue;

    const checkInTime = new Date(today);
    checkInTime.setHours(8, 0, 0, 0);
    const checkOutTime = new Date(today);
    checkOutTime.setHours(17, 30, 0, 0);

    try {
      await prisma.attendanceRecord.upsert({
        where: { userId_workDate: { userId: assign.userId, workDate: assign.workDate } },
        update: { checkInAt: checkInTime, checkOutAt: checkOutTime, status: AttendanceStatus.CHECKED_OUT },
        create: {
          userId: assign.userId,
          departmentId: assign.departmentId,
          shiftAssignmentId: assign.id,
          workDate: assign.workDate,
          checkInAt: checkInTime,
          checkOutAt: checkOutTime,
          status: AttendanceStatus.CHECKED_OUT,
        }
      });
      console.log(`Mocked attendance for user ${assign.user.profile?.fullName || assign.userId}`);
      count++;
    } catch (e) {
      console.error(`Error mocking attendance for user ${assign.userId}:`, e);
    }
  }

  console.log(`Successfully mocked ${count} attendance records.`);
  await app.close();
}

bootstrap().catch(console.error);
