import { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function run() {
  const passwordHash = await bcrypt.hash('123456', 10);
  const employeeRole = await prisma.role.findFirstOrThrow({ where: { code: 'EMPLOYEE' } });
  
  const liveDept = await prisma.department.findFirstOrThrow({ where: { code: 'CN_HO_CHI_MINH_1_LIVE' } });
  const cskhDept = await prisma.department.findFirstOrThrow({ where: { code: 'CN_HO_CHI_MINH_1_CSKH' } });

  const livePos = await prisma.position.findFirst({ where: { code: 'POS_STAFF_LIVE' } });
  const cskhPos = await prisma.position.findFirst({ where: { code: 'POS_STAFF_CSKH' } });

  // 1. Tạo hoặc cập nhật tài khoản Nhân viên Live
  const livePhone = '0988111222';
  let liveUser = await prisma.user.findUnique({ where: { phone: livePhone } });

  if (!liveUser) {
    const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;

    liveUser = await prisma.user.create({
      data: {
        userCode,
        phone: livePhone,
        email: 'nv.live@movielegend.vn',
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: 'Nguyễn Văn Live (Nhân viên Live)',
            idCardNumber: '001200000001',
            employmentStatus: EmploymentStatus.OFFICIAL,
            joinDate: new Date(),
            positionId: livePos?.id,
          }
        },
        roles: {
          create: {
            roleId: employeeRole.id,
            scopeType: RoleScopeType.GLOBAL,
          }
        },
        departmentLinks: {
          create: {
            departmentId: liveDept.id,
            isPrimary: true,
            positionId: livePos?.id,
          }
        }
      }
    });
    console.log(`[Created] Live User: ${liveUser.phone} (${liveUser.userCode})`);
  } else {
    await prisma.user.update({
      where: { id: liveUser.id },
      data: {
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      }
    });
    console.log(`[Updated] Live User: ${liveUser.phone}`);
  }

  // 2. Tạo hoặc cập nhật tài khoản Nhân viên CSKH
  const cskhPhone = '0988333444';
  let cskhUser = await prisma.user.findUnique({ where: { phone: cskhPhone } });

  if (!cskhUser) {
    const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;

    cskhUser = await prisma.user.create({
      data: {
        userCode,
        phone: cskhPhone,
        email: 'nv.cskh@movielegend.vn',
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName: 'Trần Thị CSKH (Nhân viên CSKH)',
            idCardNumber: '001200000002',
            employmentStatus: EmploymentStatus.OFFICIAL,
            joinDate: new Date(),
            positionId: cskhPos?.id,
          }
        },
        roles: {
          create: {
            roleId: employeeRole.id,
            scopeType: RoleScopeType.GLOBAL,
          }
        },
        departmentLinks: {
          create: {
            departmentId: cskhDept.id,
            isPrimary: true,
            positionId: cskhPos?.id,
          }
        }
      }
    });
    console.log(`[Created] CSKH User: ${cskhUser.phone} (${cskhUser.userCode})`);
  } else {
    await prisma.user.update({
      where: { id: cskhUser.id },
      data: {
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      }
    });
    console.log(`[Updated] CSKH User: ${cskhUser.phone}`);
  }

  // 3. Đồng bộ mật khẩu 123456 cho 2 tài khoản demo sẵn có để tiện dùng
  await prisma.user.updateMany({
    where: { phone: { in: ['0900000008', '0900000006'] } },
    data: { passwordHash }
  });
  console.log('[Updated] Reset password 123456 for 0900000008 and 0900000006');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
