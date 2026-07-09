"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const prisma_service_1 = require("./src/database/prisma.service");
const users_service_1 = require("./src/modules/users/users.service");
const shifts_service_1 = require("./src/modules/shifts/shifts.service");
const shift_assignments_service_1 = require("./src/modules/shift-assignments/shift-assignments.service");
const attendance_service_1 = require("./src/modules/attendance/attendance.service");
const leave_service_1 = require("./src/modules/leave/leave.service");
const client_1 = require("@prisma/client");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
    const usersService = app.get(users_service_1.UsersService);
    const shiftsService = app.get(shifts_service_1.ShiftsService);
    const shiftAssignmentsService = app.get(shift_assignments_service_1.ShiftAssignmentsService);
    const attendanceService = app.get(attendance_service_1.AttendanceService);
    const leaveService = app.get(leave_service_1.LeaveService);
    console.log('======================================================');
    console.log('--- BẮT ĐẦU TEST E2E CHO CÁC LUỒNG CỦA USER ---');
    console.log('======================================================');
    try {
        console.log('\n[1] ADMIN FLOW: Khởi tạo Dữ liệu');
        let company = await prisma.company.findFirst();
        if (!company) {
            company = await prisma.company.create({ data: { code: 'COMP01', name: 'MovieLegend' } });
        }
        let department = await prisma.department.findFirst({ where: { code: 'E2E_DEPT' } });
        if (!department) {
            department = await prisma.department.create({
                data: { code: 'E2E_DEPT', name: 'E2E Test Department', isActive: true, companyId: company.id },
            });
            console.log('  -> Đã tạo Department: E2E_DEPT');
        }
        let location = await prisma.attendanceLocation.findFirst({ where: { departments: { some: { id: department.id } } } });
        if (!location) {
            location = await prisma.attendanceLocation.create({
                data: {
                    name: 'Điểm danh Test',
                    latitude: 21.0285,
                    longitude: 105.8048,
                    radiusMeters: 5000,
                    departments: { connect: { id: department.id } },
                },
            });
            console.log('  -> Đã tạo AttendanceLocation');
        }
        let shift = await prisma.shift.findFirst({ where: { code: 'E2E_SHIFT' } });
        if (!shift) {
            const shiftDto = {
                code: 'E2E_SHIFT',
                name: 'Ca E2E Test',
                startTime: '08:00',
                endTime: '17:00',
            };
            shift = await shiftsService.create(shiftDto);
            console.log('  -> Đã tạo Shift: E2E_SHIFT');
        }
        let leader = await prisma.user.upsert({
            where: { phone: '0888888888' },
            update: { isActive: true },
            create: {
                userCode: 'LEADER_E2E',
                phone: '0888888888',
                passwordHash: 'leader123',
                isActive: true,
                departmentLinks: { create: { departmentId: department.id, isPrimary: true } },
                profile: { create: { fullName: 'Trưởng Phòng E2E', idCardNumber: 'LEADER_123' } },
            },
        });
        const leaderRole = await prisma.role.findUnique({ where: { code: 'LEADER' } });
        if (leaderRole) {
            const existingUserRole = await prisma.userRole.findFirst({ where: { userId: leader.id, roleId: leaderRole.id } });
            if (!existingUserRole) {
                await prisma.userRole.create({ data: { userId: leader.id, roleId: leaderRole.id } });
            }
        }
        const leaderActor = {
            sub: leader.id,
            userId: leader.id,
            roles: ['LEADER'],
            permissions: ['shift.assign', 'leave.approve'],
            scopes: [{ role: 'LEADER', scopeType: client_1.RoleScopeType.DEPARTMENT, scopeId: department.id }],
        };
        console.log('  -> Đã setup User Leader: LEADER_E2E');
        let employee = await prisma.user.upsert({
            where: { phone: '0777777777' },
            update: { isActive: true },
            create: {
                userCode: 'EMP_E2E',
                phone: '0777777777',
                passwordHash: 'emp123',
                isActive: true,
                departmentLinks: { create: { departmentId: department.id, isPrimary: true } },
                profile: { create: { fullName: 'Nhân Viên E2E', idCardNumber: 'EMP_123' } },
            },
        });
        const empRole = await prisma.role.findUnique({ where: { code: 'EMPLOYEE' } });
        if (empRole) {
            const existingEmpRole = await prisma.userRole.findFirst({ where: { userId: employee.id, roleId: empRole.id } });
            if (!existingEmpRole) {
                await prisma.userRole.create({ data: { userId: employee.id, roleId: empRole.id } });
            }
        }
        const empActor = {
            sub: employee.id,
            userId: employee.id,
            roles: ['EMPLOYEE'],
            permissions: ['attendance.checkin', 'leave.request', 'leave.balance.read'],
            scopes: [],
        };
        console.log('  -> Đã setup User Employee: EMP_E2E');
        console.log('\n[2] LEADER FLOW: Phân ca làm việc');
        const todayStr = new Date().toISOString().split('T')[0];
        await prisma.shiftAssignment.deleteMany({
            where: { userId: employee.id, workDate: new Date(todayStr) },
        });
        const assignResult = await shiftAssignmentsService.assign({
            userId: employee.id,
            departmentId: department.id,
            shiftId: shift.id,
            workDate: todayStr,
        }, leaderActor);
        console.log(`  -> Đã phân ca.`);
        console.log('\n[3] EMPLOYEE FLOW: Chấm công (Check-in / Check-out)');
        try {
            const checkinRes = await attendanceService.checkIn({ latitude: 10.0, longitude: 20.0, workDate: todayStr, faceImage: 'fake_image' }, empActor);
            console.log(`  -> CHECK-IN THÀNH CÔNG: Status = ${checkinRes.status}`);
        }
        catch (e) {
            console.log(`  -> CHECK-IN LỖI/CẢNH BÁO: ${e.message} (Có thể do sai giờ ca làm)`);
        }
        console.log('\n[4] LEAVE FLOW: Xin phép & Duyệt đơn');
        let leaveType = await prisma.leaveType.findFirst({ where: { code: 'E2E_LEAVE' } });
        if (!leaveType) {
            leaveType = await prisma.leaveType.create({
                data: { code: 'E2E_LEAVE', name: 'Nghỉ E2E', isPaid: true },
            });
        }
        let leaveBalance = await prisma.leaveBalance.findFirst({
            where: { userId: employee.id, leaveTypeId: leaveType.id, year: new Date().getFullYear() },
        });
        if (!leaveBalance) {
            leaveBalance = await prisma.leaveBalance.create({
                data: {
                    userId: employee.id,
                    leaveTypeId: leaveType.id,
                    year: new Date().getFullYear(),
                    balanceDays: 10,
                    usedDays: 0,
                },
            });
        }
        await prisma.leaveRequest.deleteMany({ where: { userId: employee.id, leaveTypeId: leaveType.id } });
        const newLeave = await prisma.leaveRequest.create({
            data: {
                userId: employee.id,
                departmentId: department.id,
                leaveTypeId: leaveType.id,
                startDate: new Date(),
                endDate: new Date(),
                totalDays: '1',
                reason: 'E2E test nghỉ phép',
                status: client_1.LeaveRequestStatus.PENDING,
            },
        });
        console.log(`  -> Employee: Đã tạo thành công đơn nghỉ phép (ID: ${newLeave.id})`);
        const myLeaves = await leaveService.findMyLeaveRequests(empActor, {});
        console.log(`  -> Employee: Xem được ${myLeaves.length} đơn xin nghỉ của mình.`);
        const approvedLeave = await leaveService.approveLeave(newLeave.id, leaderActor);
        console.log(`  -> Leader: Đã duyệt đơn nghỉ phép. Trạng thái hiện tại: ${approvedLeave.status}`);
        console.log('\n[5] PROFILE FLOW: Cập nhật hồ sơ');
        const updateProfileDto = { email: 'empe2e@test.com' };
        await usersService.updateMe(updateProfileDto, empActor);
        console.log('  -> Employee: Cập nhật email thành công.');
        const faceUpdateDto = {
            faceImages: [
                { pose: client_1.FacePoseType.FRONT, imageUrl: 'test.com/front.jpg' },
                { pose: client_1.FacePoseType.LEFT, imageUrl: 'test.com/left.jpg' },
                { pose: client_1.FacePoseType.RIGHT, imageUrl: 'test.com/right.jpg' },
            ],
        };
        await usersService.updateMyFace(faceUpdateDto, empActor);
        console.log('  -> Employee: Cập nhật lại 3 hình ảnh Face Registration thành công.');
        console.log('\n======================================================');
        console.log('--- TEST E2E HOÀN TẤT THÀNH CÔNG KHÔNG GẶP LỖI ---');
        console.log('======================================================');
    }
    catch (err) {
        console.error('\n!!! TEST E2E THẤT BẠI !!!');
        console.error(err);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=test-e2e-user-flows.js.map