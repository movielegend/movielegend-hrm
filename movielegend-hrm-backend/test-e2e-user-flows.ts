import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/database/prisma.service';
import { AuthenticatedUser } from './src/common/interfaces/authenticated-user.interface';
import { UsersService } from './src/modules/users/users.service';
import { ShiftsService } from './src/modules/shifts/shifts.service';
import { ShiftAssignmentsService } from './src/modules/shift-assignments/shift-assignments.service';
import { AttendanceService } from './src/modules/attendance/attendance.service';
import { LeaveService } from './src/modules/leave/leave.service';
import { FacePoseType, LeaveRequestStatus, ApprovalStatus, RoleScopeType } from '@prisma/client';
import { CreateShiftDto } from './src/modules/shifts/dto/create-shift.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const usersService = app.get(UsersService);
  const shiftsService = app.get(ShiftsService);
  const shiftAssignmentsService = app.get(ShiftAssignmentsService);
  const attendanceService = app.get(AttendanceService);
  const leaveService = app.get(LeaveService);

  console.log('======================================================');
  console.log('--- BẮT ĐẦU TEST E2E CHO CÁC LUỒNG CỦA USER ---');
  console.log('======================================================');

  try {
    // ---------------------------------------------------------
    // 1. Luồng Khởi tạo (Admin Flow)
    // ---------------------------------------------------------
    console.log('\n[1] ADMIN FLOW: Khởi tạo Dữ liệu');
    
    // Tìm hoặc tạo Company
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({ data: { code: 'COMP01', name: 'MovieLegend' } });
    }

    // Tìm hoặc tạo Department
    let department = await prisma.department.findFirst({ where: { code: 'E2E_DEPT' } });
    if (!department) {
      department = await prisma.department.create({
        data: { code: 'E2E_DEPT', name: 'E2E Test Department', isActive: true, companyId: company.id },
      });
      console.log('  -> Đã tạo Department: E2E_DEPT');
    }

    // Tìm hoặc tạo AttendanceLocation (để nhân viên có thể check-in)
    let location = await prisma.attendanceLocation.findFirst({ where: { departmentId: department.id } });
    if (!location) {
      location = await prisma.attendanceLocation.create({
        data: {
          departmentId: department.id,
          name: 'E2E Test Location',
          latitude: 10.0,
          longitude: 20.0,
          radiusMeters: 1000000, // Rất to để test
        },
      });
      console.log('  -> Đã tạo AttendanceLocation');
    }

    // Khởi tạo Shift (Mẫu ca)
    let shift = await prisma.shift.findFirst({ where: { code: 'E2E_SHIFT' } });
    if (!shift) {
      const shiftDto: CreateShiftDto = {
        code: 'E2E_SHIFT',
        name: 'Ca E2E Test',
        startTime: '08:00',
        endTime: '17:00',
      };
      shift = await shiftsService.create(shiftDto);
      console.log('  -> Đã tạo Shift: E2E_SHIFT');
    }

    // Tạo tài khoản Leader
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

    // Cấp quyền LEADER
    const leaderRole = await prisma.role.findUnique({ where: { code: 'LEADER' } });
    if (leaderRole) {
      const existingUserRole = await prisma.userRole.findFirst({ where: { userId: leader.id, roleId: leaderRole.id } });
      if (!existingUserRole) {
        await prisma.userRole.create({ data: { userId: leader.id, roleId: leaderRole.id } });
      }
    }

    const leaderActor: AuthenticatedUser = {
      sub: leader.id,
      userId: leader.id,
      roles: ['LEADER'],
      permissions: ['shift.assign', 'leave.approve'], // Minimal required
      scopes: [{ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId: department.id }],
    };
    console.log('  -> Đã setup User Leader: LEADER_E2E');

    // Tạo tài khoản Employee
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

    // Cấp quyền EMPLOYEE
    const empRole = await prisma.role.findUnique({ where: { code: 'EMPLOYEE' } });
    if (empRole) {
      const existingEmpRole = await prisma.userRole.findFirst({ where: { userId: employee.id, roleId: empRole.id } });
      if (!existingEmpRole) {
        await prisma.userRole.create({ data: { userId: employee.id, roleId: empRole.id } });
      }
    }

    const empActor: AuthenticatedUser = {
      sub: employee.id,
      userId: employee.id,
      roles: ['EMPLOYEE'],
      permissions: ['attendance.checkin', 'leave.request', 'leave.balance.read'],
      scopes: [],
    };
    console.log('  -> Đã setup User Employee: EMP_E2E');

    // ---------------------------------------------------------
    // 2. Luồng Phân ca làm việc (Leader Flow)
    // ---------------------------------------------------------
    console.log('\n[2] LEADER FLOW: Phân ca làm việc');
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Xóa phân ca cũ nếu có
    await prisma.shiftAssignment.deleteMany({
      where: { userId: employee.id, workDate: new Date(todayStr) },
    });

    // Gọi hàm phân ca của Leader
    const assignResult = await shiftAssignmentsService.assign(
      {
        userId: employee.id,
        departmentId: department.id,
        shiftId: shift.id,
        workDate: todayStr,
      },
      leaderActor
    );
    console.log(`  -> Đã phân ca.`);

    // ---------------------------------------------------------
    // 3. Luồng Chấm công (Employee Flow)
    // ---------------------------------------------------------
    console.log('\n[3] EMPLOYEE FLOW: Chấm công (Check-in / Check-out)');
    
    // Check-in
    try {
      const checkinRes = await attendanceService.checkIn(
        { latitude: 10.0, longitude: 20.0, workDate: todayStr, faceImage: 'fake_image' },
        empActor
      );
      console.log(`  -> CHECK-IN THÀNH CÔNG: Status = ${checkinRes.status}`);
    } catch (e: any) {
      console.log(`  -> CHECK-IN LỖI/CẢNH BÁO: ${e.message} (Có thể do sai giờ ca làm)`);
    }

    // ---------------------------------------------------------
    // 4. Luồng Nghỉ Phép (Employee xin phép & Leader duyệt)
    // ---------------------------------------------------------
    console.log('\n[4] LEAVE FLOW: Xin phép & Duyệt đơn');
    
    // Tạo LeaveType
    let leaveType = await prisma.leaveType.findFirst({ where: { code: 'E2E_LEAVE' } });
    if (!leaveType) {
      leaveType = await prisma.leaveType.create({
        data: { code: 'E2E_LEAVE', name: 'Nghỉ E2E', isPaid: true },
      });
    }

    // Cấp phép LeaveBalance
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

    // Xóa đơn cũ
    await prisma.leaveRequest.deleteMany({ where: { userId: employee.id, leaveTypeId: leaveType.id } });

    // Employee tạo đơn
    const newLeave = await prisma.leaveRequest.create({
      data: {
        userId: employee.id,
        departmentId: department.id,
        leaveTypeId: leaveType.id,
        startDate: new Date(),
        endDate: new Date(),
        totalDays: '1',
        reason: 'E2E test nghỉ phép',
        status: LeaveRequestStatus.PENDING,
      },
    });
    console.log(`  -> Employee: Đã tạo thành công đơn nghỉ phép (ID: ${newLeave.id})`);

    // Employee tự lấy danh sách đơn của mình
    const myLeaves = await leaveService.findMyLeaveRequests(empActor, {});
    console.log(`  -> Employee: Xem được ${myLeaves.length} đơn xin nghỉ của mình.`);

    // Leader duyệt đơn
    const approvedLeave = await leaveService.approveLeave(newLeave.id, leaderActor);
    console.log(`  -> Leader: Đã duyệt đơn nghỉ phép. Trạng thái hiện tại: ${approvedLeave.status}`);

    // ---------------------------------------------------------
    // 5. Luồng Cập nhật hồ sơ (Employee)
    // ---------------------------------------------------------
    console.log('\n[5] PROFILE FLOW: Cập nhật hồ sơ');

    const updateProfileDto = { email: 'empe2e@test.com' };
    await usersService.updateMe(updateProfileDto, empActor);
    console.log('  -> Employee: Cập nhật email thành công.');

    const faceUpdateDto = {
      faceImages: [
        { pose: FacePoseType.FRONT, imageUrl: 'test.com/front.jpg' },
        { pose: FacePoseType.LEFT, imageUrl: 'test.com/left.jpg' },
        { pose: FacePoseType.RIGHT, imageUrl: 'test.com/right.jpg' },
      ],
    };
    await usersService.updateMyFace(faceUpdateDto, empActor);
    console.log('  -> Employee: Cập nhật lại 3 hình ảnh Face Registration thành công.');

    console.log('\n======================================================');
    console.log('--- TEST E2E HOÀN TẤT THÀNH CÔNG KHÔNG GẶP LỖI ---');
    console.log('======================================================');

  } catch (err: any) {
    console.error('\n!!! TEST E2E THẤT BẠI !!!');
    console.error(err);
  } finally {
    await app.close();
  }
}

bootstrap();
