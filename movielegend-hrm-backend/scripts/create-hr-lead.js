const { PrismaClient, RoleScopeType, AccountStatus, ApprovalStatus, EmploymentStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu tạo tài khoản Lead Phòng ban HR ---');

  // 1. Tìm hoặc tạo phòng ban HR
  let hrDept = await prisma.department.findFirst({
    where: {
      OR: [
        { code: 'PB-261005112658' },
        { name: { contains: 'HR', mode: 'insensitive' } },
        { name: { contains: 'Nhân sự', mode: 'insensitive' } },
      ],
    },
  });

  if (!hrDept) {
    const company = await prisma.company.findFirst();
    hrDept = await prisma.department.create({
      data: {
        code: 'DEPT_HR',
        name: 'Phòng Nhân sự (HR)',
        description: 'Phòng quản lý Nhân sự & Tuyển dụng toàn công ty',
        companyId: company ? company.id : undefined,
      },
    });
    console.log('Đã tạo phòng ban HR:', hrDept.id);
  } else {
    console.log('Tìm thấy phòng ban HR:', hrDept.id, hrDept.name);
  }

  // 2. Tìm hoặc tạo chức vụ Trưởng phòng Nhân sự
  const position = await prisma.position.upsert({
    where: { code: 'POS_LEADER_HR' },
    update: {
      name: 'Trưởng phòng Nhân sự',
      departmentId: hrDept.id,
    },
    create: {
      code: 'POS_LEADER_HR',
      name: 'Trưởng phòng Nhân sự',
      description: 'Quản lý toàn bộ hoạt động nhân sự và tuyển dụng',
      departmentId: hrDept.id,
    },
  });
  console.log('Chức vụ:', position.name);

  // 3. Tìm các roles cần thiết: HR, LEADER, EMPLOYEE
  const hrRole = await prisma.role.findFirst({ where: { code: 'HR' } });
  const leaderRole = await prisma.role.findFirst({ where: { code: 'LEADER' } });
  const employeeRole = await prisma.role.findFirst({ where: { code: 'EMPLOYEE' } });

  if (!hrRole || !leaderRole) {
    throw new Error('Không tìm thấy role HR hoặc LEADER trong hệ thống!');
  }

  // 4. Mật khẩu admin123 (tối thiểu 8 ký tự theo chuẩn hệ thống)
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  // 5. Tạo hoặc cập nhật tài khoản Lead HR: SĐT 0900000010
  const phone = '0900000010';
  const email = 'lead.hr@movielegend.vn';
  const fullName = 'Phạm Quỳnh Nga (Leader HR)';

  let user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        userCode: 'HR_LEAD',
        phone,
        email,
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName,
            idCardNumber: '001200008888',
            employmentStatus: EmploymentStatus.OFFICIAL,
            positionId: position.id,
            currentLevelNumber: 4,
          },
        },
      },
    });
    console.log('Đã tạo user mới:', user.id, user.phone);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          upsert: {
            create: {
              fullName,
              idCardNumber: '001200008888',
              employmentStatus: EmploymentStatus.OFFICIAL,
              positionId: position.id,
              currentLevelNumber: 4,
            },
            update: {
              fullName,
              positionId: position.id,
              employmentStatus: EmploymentStatus.OFFICIAL,
            },
          },
        },
      },
    });
    console.log('Đã cập nhật user:', user.id, user.phone);
  }

  // 6. Gán các roles: HR (GLOBAL) và LEADER (DEPARTMENT)
  // Xóa roles cũ của user này để gán chuẩn
  await prisma.userRole.deleteMany({
    where: { userId: user.id },
  });

  // Gán role HR
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: hrRole.id,
      scopeType: RoleScopeType.GLOBAL,
      scopeId: null,
    },
  });

  // Gán role LEADER cho Phòng HR
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: leaderRole.id,
      scopeType: RoleScopeType.DEPARTMENT,
      scopeId: hrDept.id,
    },
  });

  // Gán role EMPLOYEE
  if (employeeRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: employeeRole.id,
        scopeType: RoleScopeType.GLOBAL,
        scopeId: null,
      },
    });
  }
  console.log('Đã gán roles: HR, LEADER, EMPLOYEE');

  // 7. Cập nhật leaderUserId của Department
  await prisma.department.update({
    where: { id: hrDept.id },
    data: {
      leaderUserId: user.id,
    },
  });
  console.log('Đã gán user làm Leader của phòng ban:', hrDept.name);

  // 8. Thêm user vào DepartmentMember
  await prisma.departmentMember.upsert({
    where: {
      departmentId_userId: {
        departmentId: hrDept.id,
        userId: user.id,
      },
    },
    update: {
      positionId: position.id,
      isPrimary: true,
    },
    create: {
      departmentId: hrDept.id,
      userId: user.id,
      positionId: position.id,
      isPrimary: true,
    },
  });
  console.log('Đã thêm vào DepartmentMember');

  // 9. Cập nhật thêm mật khẩu của tài khoản 0900000009 (HR001) thành 123456 và gán vào phòng HR luôn để tiện dùng
  const existingHr = await prisma.user.findUnique({
    where: { phone: '0900000009' },
  });
  if (existingHr) {
    await prisma.user.update({
      where: { id: existingHr.id },
      data: {
        passwordHash,
        email: existingHr.email || 'hr01@movielegend.vn',
      },
    });
    await prisma.departmentMember.upsert({
      where: {
        departmentId_userId: {
          departmentId: hrDept.id,
          userId: existingHr.id,
        },
      },
      update: { isPrimary: true },
      create: {
        departmentId: hrDept.id,
        userId: existingHr.id,
        isPrimary: true,
      },
    });
    console.log('Đã cập nhật mật khẩu 123456 cho tài khoản HR001 (0900000009)');
  }

  console.log('--- HOÀN THÀNH ---');
  console.log('Thông tin tài khoản HR Lead:');
  console.log('- Số điện thoại (Tên đăng nhập):', phone);
  console.log('- Mật khẩu:', password);
  console.log('- Email:', email);
  console.log('- Họ tên:', fullName);
  console.log('- Phòng ban:', hrDept.name);
  console.log('- Chức vụ:', position.name);
  console.log('- Vai trò (Roles): HR (GLOBAL), LEADER (Phòng HR)');
}

main()
  .catch((e) => {
    console.error('Lỗi tạo tài khoản:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
