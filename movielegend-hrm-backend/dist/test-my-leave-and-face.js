"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const prisma_service_1 = require("./src/database/prisma.service");
const users_service_1 = require("./src/modules/users/users.service");
const leave_service_1 = require("./src/modules/leave/leave.service");
const client_1 = require("@prisma/client");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
    const usersService = app.get(users_service_1.UsersService);
    const leaveService = app.get(leave_service_1.LeaveService);
    console.log('--- Starting Test for My Leave Requests & Face Update ---');
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
    const actor = {
        sub: user.id,
        userId: user.id,
        roles: ['EMPLOYEE'],
        permissions: ['leave.balance.read', 'leave.request'],
        scopes: [],
    };
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
    const department = await prisma.department.findFirst({ where: { code: 'TEST_DEPT' } });
    if (department) {
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
                    status: client_1.LeaveRequestStatus.PENDING,
                },
            });
            console.log('Created a dummy leave request.');
        }
    }
    console.log('Testing findMyLeaveRequests...');
    const myLeaves = await leaveService.findMyLeaveRequests(actor, {});
    console.log(`Found ${myLeaves.length} leave requests for user.`);
    if (myLeaves.length > 0) {
        console.log(`- Request status: ${myLeaves[0].status}, Reason: ${myLeaves[0].reason}`);
    }
    console.log('\nTesting updateMyFace...');
    const faceUpdateDto = {
        faceImages: [
            { pose: client_1.FacePoseType.FRONT, imageUrl: 'https://example.com/front.jpg' },
            { pose: client_1.FacePoseType.LEFT, imageUrl: 'https://example.com/left.jpg' },
            { pose: client_1.FacePoseType.RIGHT, imageUrl: 'https://example.com/right.jpg' },
        ],
    };
    try {
        const faceResult = await usersService.updateMyFace(faceUpdateDto, actor);
        console.log('Face update result:', faceResult);
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                faceProfile: {
                    include: { images: true },
                },
            },
        });
        console.log(`Saved ${updatedUser?.faceProfile?.images.length} face images in DB.`);
    }
    catch (error) {
        console.log('Face update Failed:', error.message);
    }
    console.log('--- Test Complete ---');
    await app.close();
}
bootstrap().catch(console.error);
//# sourceMappingURL=test-my-leave-and-face.js.map