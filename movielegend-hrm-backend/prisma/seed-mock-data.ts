import { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType, LeaveRequestStatus, AttendanceStatus, ShiftAssignmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker/locale/vi';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu sinh dữ liệu ảo (Mock Data)...');
  
  // 1. Tìm Company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({ data: { code: 'MOVIE_LEGEND', name: 'Movie Legend' } });
  }

  // 2. Lấy Roles
  const leaderRole = await prisma.role.findUnique({ where: { code: 'LEADER' } });
  const employeeRole = await prisma.role.findUnique({ where: { code: 'EMPLOYEE' } });
  if (!leaderRole || !employeeRole) {
    throw new Error('Vui lòng chạy "npm run seed" trước để khởi tạo các Role cơ bản.');
  }

  // 3. Khởi tạo 5 Phòng ban (Departments)
  const departmentsData = [
    { code: 'HR', name: 'Nhân Sự' },
    { code: 'IT', name: 'Công Nghệ Thông Tin' },
    { code: 'SALES', name: 'Kinh Doanh' },
    { code: 'MKT', name: 'Marketing' },
    { code: 'OPS', name: 'Vận Hành' },
  ];
  const departments = [];
  for (const dept of departmentsData) {
    const d = await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: dept.code } },
      update: {},
      create: { companyId: company.id, code: dept.code, name: dept.name, isActive: true },
    });
    departments.push(d);
  }
  console.log(`Đã tạo/kiểm tra ${departments.length} phòng ban.`);

  // 4. Khởi tạo Vị trí (Positions)
  const positions = [];
  for (let i = 0; i < 3; i++) {
    const p = await prisma.position.upsert({
      where: { code: `POS_${i}` },
      update: {},
      create: { code: `POS_${i}`, name: faker.person.jobTitle(), description: faker.person.jobDescriptor(), isActive: true },
    });
    positions.push(p);
  }

  // 5. Khởi tạo Users (Mỗi phòng ban có 1 Leader và 3-4 Employees)
  const passwordHash = await bcrypt.hash('123456', 10);
  const allUsers = [];
  
  for (const dept of departments) {
    // Tạo 1 Leader
    const leaderPhone = faker.helpers.fromRegExp(/09[0-9]{8}/);
    const leaderCode = faker.helpers.fromRegExp(/LDR[0-9]{4}/);
    const leader = await prisma.user.upsert({
      where: { phone: leaderPhone },
      update: {},
      create: {
        userCode: leaderCode,
        phone: leaderPhone,
        email: faker.internet.email(),
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        departmentLinks: {
          create: { departmentId: dept.id, isPrimary: true, positionId: positions[0].id },
        },
        profile: {
          create: {
            fullName: faker.person.fullName(),
            idCardNumber: faker.string.numeric(12),
            gender: 'MALE',
            employmentStatus: EmploymentStatus.OFFICIAL,
            joinDate: faker.date.past({ years: 2 }),
          },
        },
      },
    });
    
    // Gán role LEADER và cấp Scope phòng ban
    const leaderScope = await prisma.userRole.findFirst({ where: { userId: leader.id, roleId: leaderRole.id } });
    if (!leaderScope) {
      await prisma.userRole.create({
        data: {
          userId: leader.id,
          roleId: leaderRole.id,
          scopeType: RoleScopeType.DEPARTMENT,
          scopeId: dept.id,
        },
      });
    }
    allUsers.push({ user: leader, role: 'LEADER', departmentId: dept.id });

    // Tạo 3-4 Employees
    const numEmployees = faker.number.int({ min: 3, max: 4 });
    for (let i = 0; i < numEmployees; i++) {
      const empPhone = faker.helpers.fromRegExp(/0[3578][0-9]{8}/);
      const empCode = faker.helpers.fromRegExp(/EMP[0-9]{4}/);
      const emp = await prisma.user.upsert({
        where: { phone: empPhone },
        update: {},
        create: {
          userCode: empCode,
          phone: empPhone,
          email: faker.internet.email(),
          passwordHash,
          accountStatus: AccountStatus.ACTIVE,
          approvalStatus: ApprovalStatus.APPROVED,
          isActive: true,
          departmentLinks: {
            create: { departmentId: dept.id, isPrimary: true, positionId: positions[1].id },
          },
          profile: {
            create: {
              fullName: faker.person.fullName(),
              idCardNumber: faker.string.numeric(12),
              gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
              employmentStatus: EmploymentStatus.OFFICIAL,
              joinDate: faker.date.past({ years: 1 }),
            },
          },
        },
      });
      
      const empScope = await prisma.userRole.findFirst({ where: { userId: emp.id, roleId: employeeRole.id } });
      if (!empScope) {
        await prisma.userRole.create({
          data: {
            userId: emp.id,
            roleId: employeeRole.id,
            scopeType: RoleScopeType.GLOBAL,
          },
        });
      }
      allUsers.push({ user: emp, role: 'EMPLOYEE', departmentId: dept.id });
    }
  }
  console.log(`Đã tạo ${allUsers.length} Users (Leaders & Employees). Password chung: 123456`);

  // 6. Khởi tạo Ca làm việc (Shifts)
  const shiftsData = [
    { code: 'HC', name: 'Ca Hành Chính', startTime: '08:00', endTime: '17:00' },
    { code: 'SANG', name: 'Ca Sáng', startTime: '06:00', endTime: '14:00' },
    { code: 'CHIEU', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00' },
  ];
  const shifts = [];
  for (const s of shiftsData) {
    const shift = await prisma.shift.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: true,
      },
    });
    shifts.push(shift);
  }
  console.log(`Đã tạo ${shifts.length} Ca làm việc.`);

  // 7. Khởi tạo Loại Nghỉ phép (LeaveTypes) & Cấp Quỹ Phép (LeaveBalance)
  let annualLeave = await prisma.leaveType.findFirst({ where: { code: 'ANNUAL' } });
  if (!annualLeave) {
    annualLeave = await prisma.leaveType.create({
      data: { code: 'ANNUAL', name: 'Nghỉ Phép Năm', isPaid: true },
    });
  }

  const currentYear = new Date().getFullYear();
  for (const u of allUsers) {
    await prisma.leaveBalance.upsert({
      where: {
        userId_leaveTypeId_year: {
          userId: u.user.id,
          leaveTypeId: annualLeave.id,
          year: currentYear,
        },
      },
      update: {},
      create: {
        userId: u.user.id,
        leaveTypeId: annualLeave.id,
        year: currentYear,
        balanceDays: 12,
        usedDays: 0,
      },
    });
  }
  console.log(`Đã cấp 12 ngày phép năm cho tất cả Users.`);

  // 8. Tạo dữ liệu Nghỉ Phép ngẫu nhiên
  const today = new Date();
  let leaveRequestsCount = 0;
  for (const u of allUsers) {
    if (u.role === 'EMPLOYEE' && faker.datatype.boolean({ probability: 0.3 })) {
      // 30% xác suất có đơn xin nghỉ
      const startDate = faker.date.recent({ days: 10 });
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + faker.number.int({ min: 0, max: 2 }));
      
      const status = faker.helpers.arrayElement([
        LeaveRequestStatus.PENDING,
        LeaveRequestStatus.APPROVED,
        LeaveRequestStatus.REJECTED,
      ]);

      await prisma.leaveRequest.create({
        data: {
          userId: u.user.id,
          departmentId: u.departmentId,
          leaveTypeId: annualLeave.id,
          startDate: startDate,
          endDate: endDate,
          totalDays: String(faker.number.int({ min: 1, max: 3 })),
          reason: faker.lorem.sentence(),
          status: status,
        },
      });
      leaveRequestsCount++;
    }
  }
  console.log(`Đã tạo ngẫu nhiên ${leaveRequestsCount} đơn xin phép.`);

  // 9. Phân ca (ShiftAssignments) và Chấm công (AttendanceRecord)
  let attendanceCount = 0;
  for (let i = 0; i < 5; i++) {
    // 5 ngày gần đây
    const workDate = new Date();
    workDate.setDate(today.getDate() - i);
    workDate.setHours(0, 0, 0, 0);

    for (const u of allUsers) {
      if (u.role === 'EMPLOYEE') {
        const shift = faker.helpers.arrayElement(shifts);
        
        // Tạo phân ca
        const assignment = await prisma.shiftAssignment.create({
          data: {
            userId: u.user.id,
            departmentId: u.departmentId,
            shiftId: shift.id,
            workDate: workDate,
            status: ShiftAssignmentStatus.ASSIGNED,
          },
        });

        // Chỉ tạo chấm công cho quá khứ (không phải hôm nay) với 80% xác suất đi làm
        if (i > 0 && faker.datatype.boolean({ probability: 0.8 })) {
          const shiftStartH = parseInt(shift.startTime.split(':')[0]);
          const shiftEndH = parseInt(shift.endTime.split(':')[0]);

          const checkInTime = new Date(workDate);
          checkInTime.setHours(shiftStartH, faker.number.int({ min: 0, max: 15 }), 0, 0);

          const checkOutTime = new Date(workDate);
          checkOutTime.setHours(shiftEndH, faker.number.int({ min: 0, max: 30 }), 0, 0);

          await prisma.attendanceRecord.create({
            data: {
              userId: u.user.id,
              departmentId: u.departmentId,
              shiftAssignmentId: assignment.id,
              workDate: workDate,
              checkInAt: checkInTime,
              checkOutAt: checkOutTime,
              status: AttendanceStatus.CHECKED_OUT,
            },
          });
          attendanceCount++;
        }
      }
    }
  }
  console.log(`Đã gán ca và tạo ${attendanceCount} bản ghi chấm công (cho 5 ngày gần nhất).`);

  console.log('HOÀN TẤT SINH DỮ LIỆU MOCK !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
