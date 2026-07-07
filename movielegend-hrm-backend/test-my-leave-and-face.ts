import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/database/prisma.service';
import { AuthenticatedUser } from './src/common/interfaces/authenticated-user.interface';
import { UsersService } from './src/modules/users/users.service';
import { LeaveService } from './src/modules/leave/leave.service';
import { FacePoseType, LeaveRequestStatus } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const usersService = app.get(UsersService);
  const leaveService = app.get(LeaveService);

  console.log('--- Starting Test for My Leave Requests & Face Update ---');

  // 1. Get the dummy user created previously
  let user = await prisma.user.findUnique({ where: { phone: '0999999999' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        userCode: 'TEST01',
        phone: '0999999999',
        passwordHash: 'mindy123',
        profile: {
          create: { fullName: 'Test Employee', idCardNumber: '123456789' },
        },
      },
    });
  }

  const actor: AuthenticatedUser = {
    sub: user.id,
    userId: user.id,
    roles: ['EMPLOYEE'],
    permissions: ['leave.balance.read', 'leave.request'], // Just basic permissions
    scopes: [],
  };

  // 2. Prepare some Leave Type and Leave Request
  let leaveType = await prisma.leaveType.findFirst({ where: { code: 'ANNUAL_TEST' } });
  if (!leaveType) {
    const company = await prisma.company.findFirst();
    leaveType = await prisma.leaveType.create({
      data: {
        code: 'ANNUAL_TEST',
        name: 'Nghỉ phép năm test',
        isPaid: true,
      },
    });
  }

  // Find a department to assign to
  const department = await prisma.department.findFirst({ where: { code: 'TEST_DEPT' } });
  if (department) {
    // Check if a request already exists, if not create one manually via prisma
    const existingReq = await prisma.leaveRequest.findFirst({ where: { userId: user.id, leaveTypeId: leaveType.id } });
    if (!existingReq) {
      await prisma.leaveRequest.create({
        data: {
          userId: user.id,
          departmentId: department.id,
          leaveTypeId: leaveType.id,
          startDate: new Date(),
          endDate: new Date(),
          totalDays: '1',
          reason: 'Test nghỉ phép',
          status: LeaveRequestStatus.PENDING,
        },
      });
      console.log('Created a dummy leave request.');
    }
  }

  // 3. Test GET /leave-requests/my
  console.log('Testing findMyLeaveRequests...');
  const myLeaves = await leaveService.findMyLeaveRequests(actor, {});
  console.log(`Found ${myLeaves.length} leave requests for user.`);
  if (myLeaves.length > 0) {
    console.log(`- Request status: ${myLeaves[0].status}, Reason: ${myLeaves[0].reason}`);
  }

  // 4. Test PATCH /users/me/face
  console.log('\nTesting updateMyFace...');
  const faceUpdateDto = {
    faceImages: [
      { pose: FacePoseType.FRONT, imageUrl: 'https://example.com/front.jpg' },
      { pose: FacePoseType.LEFT, imageUrl: 'https://example.com/left.jpg' },
      { pose: FacePoseType.RIGHT, imageUrl: 'https://example.com/right.jpg' },
    ],
  };

  try {
    const faceResult = await usersService.updateMyFace(faceUpdateDto, actor);
    console.log('Face update result:', faceResult);
    
    // Verify it saved
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        faceProfile: {
          include: { images: true },
        },
      },
    });
    console.log(`Saved ${updatedUser?.faceProfile?.images.length} face images in DB.`);
  } catch (error: any) {
    console.log('Face update Failed:', error.message);
  }

  console.log('--- Test Complete ---');
  await app.close();
}

bootstrap().catch(console.error);
