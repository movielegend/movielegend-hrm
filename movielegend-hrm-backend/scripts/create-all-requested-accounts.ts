import 'dotenv/config';
import { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function getOrCreateUser(phone: string, fullName: string, plainPass: string, positionId?: string | null) {
  const passwordHash = await bcrypt.hash(plainPass, 12);
  let user = await prisma.user.findUnique({
    where: { phone },
    include: { profile: true },
  });

  if (!user) {
    const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
    user = await prisma.user.create({
      data: {
        userCode,
        phone,
        email: `nv.${phone}@movielegend.vn`,
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName,
            idCardNumber: `CCCD-${phone}`,
            employmentStatus: EmploymentStatus.OFFICIAL,
            positionId: positionId || null,
          },
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Tạo mới User [${user.userCode}] - SĐT: ${user.phone} - Họ tên: ${fullName}`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          upsert: {
            create: {
              fullName,
              idCardNumber: `CCCD-${phone}`,
              employmentStatus: EmploymentStatus.OFFICIAL,
              positionId: positionId || null,
            },
            update: {
              fullName,
              positionId: positionId || undefined,
            },
          },
        },
      },
      include: { profile: true },
    });
    console.log(`🔄 Cập nhật User [${user.userCode}] - SĐT: ${user.phone} - Họ tên: ${fullName}`);
  }

  return user;
}

async function assignRole(userId: string, roleCode: string, scopeType: RoleScopeType, scopeId?: string | null) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) {
    console.warn(`⚠️ Role ${roleCode} không tồn tại!`);
    return;
  }

  const existing = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId: role.id,
      scopeType,
      scopeId: scopeId || null,
    },
  });

  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        scopeType,
        scopeId: scopeId || null,
      },
    });
    console.log(`  ➕ Gán Role ${roleCode} (${scopeType}) cho User ID ${userId}`);
  }
}

async function assignDepartment(userId: string, departmentId: string, positionId?: string | null, isLeader = false) {
  await prisma.departmentMember.upsert({
    where: {
      departmentId_userId: {
        departmentId,
        userId,
      },
    },
    update: {
      positionId: positionId || null,
      isPrimary: true,
      leftAt: null,
    },
    create: {
      departmentId,
      userId,
      positionId: positionId || null,
      isPrimary: true,
    },
  });

  if (isLeader) {
    await prisma.department.update({
      where: { id: departmentId },
      data: { leaderUserId: userId },
    });
    console.log(`  👑 Đặt làm Trưởng phòng (Leader) cho Department ID: ${departmentId}`);
  }
}

async function main() {
  console.log('=== BẮT ĐẦU TẠO 4 TÀI KHOẢN YÊU CẦU ===\n');

  // --- A. CHUẨN BỊ PHÒNG LIVE MIỀN BẮC ---
  // Tìm phòng Live ở miền Bắc (Chi nhánh Đống Đa)
  let liveNorthDept = await prisma.department.findFirst({
    where: {
      code: 'CN_DONG_DA_LIVE',
    },
  });

  if (!liveNorthDept) {
    // Fallback: Tìm phòng live bất kỳ ở miền bắc
    liveNorthDept = await prisma.department.findFirst({
      where: {
        name: { contains: 'Live' },
        branch: { region: { code: 'MIEN_BAC' } },
      },
    });
  }

  if (!liveNorthDept) {
    throw new Error('Không tìm thấy Phòng Live miền Bắc!');
  }
  console.log(`📌 Phòng Live miền Bắc chọn: [${liveNorthDept.code}] ${liveNorthDept.name}`);

  const posLeaderLive = await prisma.position.findFirst({ where: { code: 'POS_LEADER_LIVE' } });
  const posStaffLive = await prisma.position.findFirst({ where: { code: 'POS_STAFF_LIVE' } });

  // 1. Nick 0347941048 (Trưởng phòng Live Miền Bắc)
  const userLiveLeader = await getOrCreateUser(
    '0347941048',
    'Trưởng Phòng Live Miền Bắc',
    'admin123',
    posLeaderLive?.id
  );
  await assignRole(userLiveLeader.id, 'LEADER', RoleScopeType.DEPARTMENT, liveNorthDept.id);
  await assignDepartment(userLiveLeader.id, liveNorthDept.id, posLeaderLive?.id, true);

  // 2. Nick 0347941049 (Nhân viên Live Miền Bắc)
  const userLiveStaff = await getOrCreateUser(
    '0347941049',
    'Nhân Viên Live Miền Bắc',
    'admin123',
    posStaffLive?.id
  );
  await assignRole(userLiveStaff.id, 'EMPLOYEE', RoleScopeType.DEPARTMENT, liveNorthDept.id);
  await assignDepartment(userLiveStaff.id, liveNorthDept.id, posStaffLive?.id, false);

  // --- B. CHUẨN BỊ PHÒNG KẾ TOÁN & VAI TRÒ ---
  // Tìm hoặc tạo phòng kế toán
  let accountingDept = await prisma.department.findFirst({
    where: {
      OR: [
        { code: { contains: 'ACCOUNT' } },
        { name: { contains: 'Kế toán', mode: 'insensitive' } },
      ],
    },
  });

  if (!accountingDept) {
    const company = await prisma.company.findFirst();
    const branch = await prisma.branch.findFirst();
    if (!company) throw new Error('Không tìm thấy Company trong database');
    accountingDept = await prisma.department.create({
      data: {
        code: 'DEPT_ACCOUNTING',
        name: 'Phòng Kế toán - Tài chính',
        description: 'Phòng ban Kế toán, Lương thưởng và Tài chính',
        companyId: company.id,
        branchId: branch?.id || null,
        isActive: true,
      },
    });
    console.log(`🆕 Tạo mới phòng ban Kế toán: [${accountingDept.code}] ${accountingDept.name}`);
  } else {
    console.log(`📌 Phòng Kế toán hiện có: [${accountingDept.code}] ${accountingDept.name}`);
  }

  // Đảm bảo có role ACCOUNTANT
  let roleAccountant = await prisma.role.findUnique({ where: { code: 'ACCOUNTANT' } });
  if (!roleAccountant) {
    roleAccountant = await prisma.role.create({
      data: {
        code: 'ACCOUNTANT',
        name: 'Kế toán',
        description: 'Vai trò Kế toán hệ thống',
        isSystem: true,
      },
    });
  }

  // Đảm bảo có vị trí Kế toán trưởng & Kế toán viên
  let posAccountantLead = await prisma.position.findFirst({
    where: { code: 'POS_ACCOUNTANT_LEAD' },
  });
  if (!posAccountantLead) {
    posAccountantLead = await prisma.position.create({
      data: {
        code: 'POS_ACCOUNTANT_LEAD',
        name: 'Kế toán trưởng',
        departmentId: accountingDept.id,
        isActive: true,
      },
    });
  }

  let posAccountantStaff = await prisma.position.findFirst({
    where: { code: 'POS_ACCOUNTANT' },
  });
  if (!posAccountantStaff) {
    posAccountantStaff = await prisma.position.create({
      data: {
        code: 'POS_ACCOUNTANT',
        name: 'Chuyên viên Kế toán',
        departmentId: accountingDept.id,
        isActive: true,
      },
    });
  }

  // 3. Nick 0347941050 (Lead Kế toán)
  const userAccLead = await getOrCreateUser(
    '0347941050',
    'Kế Toán Trưởng (Lead)',
    'admin123',
    posAccountantLead.id
  );
  // Gán role ACCOUNTANT (GLOBAL) và LEADER (DEPARTMENT)
  await assignRole(userAccLead.id, 'ACCOUNTANT', RoleScopeType.GLOBAL, null);
  await assignRole(userAccLead.id, 'LEADER', RoleScopeType.DEPARTMENT, accountingDept.id);
  await assignDepartment(userAccLead.id, accountingDept.id, posAccountantLead.id, true);

  // 4. Nick 0347941051 (Nhân viên Kế toán)
  const userAccStaff = await getOrCreateUser(
    '0347941051',
    'Nhân Viên Kế Toán',
    'admin123',
    posAccountantStaff.id
  );
  // Gán role ACCOUNTANT (GLOBAL) và EMPLOYEE (DEPARTMENT)
  await assignRole(userAccStaff.id, 'ACCOUNTANT', RoleScopeType.GLOBAL, null);
  await assignRole(userAccStaff.id, 'EMPLOYEE', RoleScopeType.DEPARTMENT, accountingDept.id);
  await assignDepartment(userAccStaff.id, accountingDept.id, posAccountantStaff.id, false);

  console.log('\n======================================================');
  console.log('✅ HOÀN TẤT TẠO / CẬP NHẬT 4 TÀI KHOẢN:');
  console.log('1. TRƯỞNG PHÒNG LIVE (MIỀN BẮC):');
  console.log(`   - SĐT: 0347941048 | Pass: admin123`);
  console.log(`   - Tên: ${userLiveLeader.profile?.fullName}`);
  console.log(`   - Phòng ban: ${liveNorthDept.name} (Leader)`);
  console.log('\n2. NHÂN VIÊN LIVE (MIỀN BẮC):');
  console.log(`   - SĐT: 0347941049 | Pass: admin123`);
  console.log(`   - Tên: ${userLiveStaff.profile?.fullName}`);
  console.log(`   - Phòng ban: ${liveNorthDept.name}`);
  console.log('\n3. KẾ TOÁN TRƯỞNG (LEAD KẾ TOÁN):');
  console.log(`   - SĐT: 0347941050 | Pass: admin123`);
  console.log(`   - Tên: ${userAccLead.profile?.fullName}`);
  console.log(`   - Phòng ban: ${accountingDept.name} (Leader)`);
  console.log(`   - Quyền: ACCOUNTANT, LEADER`);
  console.log('\n4. NHÂN VIÊN KẾ TOÁN:');
  console.log(`   - SĐT: 0347941051 | Pass: admin123`);
  console.log(`   - Tên: ${userAccStaff.profile?.fullName}`);
  console.log(`   - Phòng ban: ${accountingDept.name}`);
  console.log(`   - Quyền: ACCOUNTANT, EMPLOYEE`);
  console.log('======================================================');
}

main()
  .catch((err) => {
    console.error('❌ Lỗi tạo tài khoản:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
