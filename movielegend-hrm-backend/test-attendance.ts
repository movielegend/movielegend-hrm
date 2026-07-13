import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AttendanceService } from './src/modules/attendance/attendance.service';
import { PrismaService } from './src/database/prisma.service';
import { UploadsService } from './src/modules/uploads/uploads.service';
import { StorageService } from './src/modules/storage/storage.service';
import { AuthenticatedUser } from './src/common/interfaces/authenticated-user.interface';
import { UploadPurpose } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const attendanceService = app.get(AttendanceService);
  const storageService = app.get(StorageService);

  console.log('--- Starting Attendance Test ---');

  // 1. Create a dummy user
  const user = await prisma.user.upsert({
    where: { phone: '0999999999' },
    update: {},
    create: {
      userCode: 'TEST01',
      phone: '0999999999',
      passwordHash: 'mindy123',
      profile: {
        create: {
          fullName: 'Test Employee',
          idCardNumber: '123456789',
        },
      },
    },
  });

  // 2. Create department and location
  const company = await prisma.company.findFirst();
  const department = await prisma.department.findFirst({ where: { code: 'TEST_DEPT' } }) ??
    await prisma.department.create({
      data: {
        code: 'TEST_DEPT',
        name: 'Test Department',
        isActive: true,
        companyId: company?.id ?? 'dummy_company',
      },
    });

  const location = await prisma.attendanceLocation.create({
    data: {

      name: 'Văn phòng chính',
      latitude: 21.028511,
      longitude: 105.804817,
      radiusMeters: 5000,
      departments: { connect: { id: department.id } },
    },
  });

  // 3. Create a shift and assignment for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shift = await prisma.shift.create({
    data: {
      code: 'TEST_SHIFT_' + Date.now(),
      name: 'Test Shift',
      startTime: '00:00:00',
      endTime: '23:59:59',
      checkInEarlyMinutes: 1440,
      checkInLateMinutes: 1440,
      checkOutEarlyMinutes: 1440,
      checkOutLateMinutes: 1440,
      isActive: true,
    },
  });

  const assignment = await prisma.shiftAssignment.upsert({
    where: { userId_workDate: { userId: user.id, workDate: today } },
    update: { shiftId: shift.id, departmentId: department.id },
    create: {
      userId: user.id,
      departmentId: department.id,
      shiftId: shift.id,
      workDate: today,
    },
  });

  // Clean up any existing attendance record for today to allow re-testing
  await prisma.attendanceRecord.deleteMany({
    where: { userId: user.id, workDate: today },
  });

  // 4. Create a dummy photo upload
  const dummyBuffer = Buffer.from('<svg width="10" height="10"></svg>');
  const uploadResult = await storageService.upload({
    buffer: dummyBuffer,
    fileName: 'test.svg',
    mimeType: 'image/svg+xml',
    storageKey: 'attendance/test_' + Date.now() + '.svg',
  });

  const photo = await prisma.uploadedFile.create({
    data: {
      uploadedById: user.id,
      purpose: UploadPurpose.ATTENDANCE,
      fileName: 'test.svg',
      storageKey: uploadResult.storageKey,
      fileUrl: uploadResult.fileUrl,
      mimeType: 'image/svg+xml',
      size: dummyBuffer.length,
      checksum: 'dummy',
      status: 'TEMPORARY',
    },
  });

  const actor: AuthenticatedUser = {
    sub: user.id,
    userId: user.id,
    roles: [],
    permissions: [],
    scopes: [],
  };

  // 5. Test Check-In
  console.log('Testing Check-In...');
  try {
    const checkInResult = await attendanceService.checkIn({
      workDate: today.toISOString().split('T')[0],
      latitude: 10.001,
      longitude: 20.001,
      accuracy: 5,
      photoFileId: photo.id,
    }, actor, '127.0.0.1');
    console.log('Check-In Successful:', checkInResult.id);
  } catch (err: any) {
    console.error('Check-In Failed:', err.message);
  }

  // 6. Test Check-Out
  console.log('Testing Check-Out...');
  try {
    const checkOutResult = await attendanceService.checkOut({
      latitude: 10.001,
      longitude: 20.001,
    }, actor, '127.0.0.1');
    console.log('Check-Out Successful:', checkOutResult?.id, checkOutResult?.checkOutAt);
  } catch (err: any) {
    console.error('Check-Out Failed:', err.message);
  }

  console.log('--- Test Complete ---');
  await app.close();
}

bootstrap().catch(console.error);
