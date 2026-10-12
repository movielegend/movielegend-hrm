import 'dotenv/config';
import { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMIN' } });
  const leaderRole = await prisma.role.findUniqueOrThrow({ where: { code: 'LEADER' } });

  // 1. Tạo hoặc cập nhật tài khoản Admin 0347941047
  const adminPhone = '0347941047';
  const adminPass = 'admin123';
  const adminHash = await bcrypt.hash(adminPass, 12);

  let adminUser = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!adminUser) {
    const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
    adminUser = await prisma.user.create({
      data: {
        userCode,
        phone: adminPhone,
        email: 'admin.0347941047@movielegend.vn',
        passwordHash: adminHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: 'Admin Quản Trị Hệ Thống',
            idCardNumber: `CCCD-${adminPhone}`,
            employmentStatus: EmploymentStatus.OFFICIAL,
          },
        },
      },
    });
    console.log('✅ Created Admin user:', adminUser.userCode, adminUser.phone);
  } else {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: adminHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      },
    });
    console.log('🔄 Updated Admin user:', adminUser.userCode, adminUser.phone);
  }

  // Gán quyền Admin
  const existingAdminRole = await prisma.userRole.findFirst({
    where: { userId: adminUser.id, roleId: adminRole.id },
  });
  if (!existingAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
        scopeType: RoleScopeType.GLOBAL,
      },
    });
  }

  // 2. Tạo hoặc cập nhật tài khoản Leader (Trưởng phòng)
  const leaderPhone = '0347941048';
  const leaderPass = 'admin123';
  const leaderHash = await bcrypt.hash(leaderPass, 12);

  // Lấy phòng ban đầu tiên để gán làm Leader
  const dept = await prisma.department.findFirst({
    where: { code: { contains: 'CSKH' } },
  }) || await prisma.department.findFirst();

  const posLeader = await prisma.position.findFirst({
    where: { code: { contains: 'LEADER' } },
  });

  let leaderUser = await prisma.user.findUnique({ where: { phone: leaderPhone } });
  if (!leaderUser) {
    const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
    leaderUser = await prisma.user.create({
      data: {
        userCode,
        phone: leaderPhone,
        email: 'leader.0347941048@movielegend.vn',
        passwordHash: leaderHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: 'Trần Văn Trưởng (Leader CSKH)',
            idCardNumber: `CCCD-${leaderPhone}`,
            employmentStatus: EmploymentStatus.OFFICIAL,
            positionId: posLeader?.id,
          },
        },
      },
    });
    console.log('✅ Created Leader user:', leaderUser.userCode, leaderUser.phone);
  } else {
    leaderUser = await prisma.user.update({
      where: { id: leaderUser.id },
      data: {
        passwordHash: leaderHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      },
    });
    console.log('🔄 Updated Leader user:', leaderUser.userCode, leaderUser.phone);
  }

  // Gán quyền Leader
  const existingLeaderRole = await prisma.userRole.findFirst({
    where: { userId: leaderUser.id, roleId: leaderRole.id },
  });
  if (!existingLeaderRole) {
    await prisma.userRole.create({
      data: {
        userId: leaderUser.id,
        roleId: leaderRole.id,
        scopeType: dept ? RoleScopeType.DEPARTMENT : RoleScopeType.GLOBAL,
        scopeId: dept?.id || null,
      },
    });
  }

  // Gán vào department và set leaderUserId
  if (dept) {
    await prisma.departmentMember.upsert({
      where: {
        departmentId_userId: {
          departmentId: dept.id,
          userId: leaderUser.id,
        },
      },
      update: {
        positionId: posLeader?.id,
        isPrimary: true,
        leftAt: null,
      },
      create: {
        departmentId: dept.id,
        userId: leaderUser.id,
        positionId: posLeader?.id,
        isPrimary: true,
      },
    });

    await prisma.department.update({
      where: { id: dept.id },
      data: { leaderUserId: leaderUser.id },
    });
    console.log(`📌 Gán Leader vào phòng ban: ${dept.name} (${dept.code})`);
  }

  console.log('\n=======================================');
  console.log('TÀI KHOẢN ĐÃ ĐƯỢC TẠO THÀNH CÔNG:');
  console.log('1. Tài khoản ADMIN:');
  console.log(`   - SĐT: ${adminPhone}`);
  console.log(`   - Mật khẩu: ${adminPass}`);
  console.log(`   - Vai trò: ADMIN (Toàn quyền hệ thống)`);
  console.log('\n2. Tài khoản LEADER (Trưởng phòng):');
  console.log(`   - SĐT: ${leaderPhone}`);
  console.log(`   - Mật khẩu: ${leaderPass}`);
  console.log(`   - Tên: Trần Văn Trưởng (Leader CSKH)`);
  console.log(`   - Phòng ban: ${dept?.name || 'N/A'}`);
  console.log('=======================================');
}

main()
  .catch((err) => {
    console.error('Error creating accounts:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
