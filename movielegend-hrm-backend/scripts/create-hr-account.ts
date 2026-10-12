import 'dotenv/config';
import { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOrUpdateHrUser(phone: string, fullName: string, email: string, pass: string = 'admin123') {
  // 1. Role HR
  let hrRole = await prisma.role.findUnique({ where: { code: 'HR' } });
  if (!hrRole) {
    hrRole = await prisma.role.create({
      data: {
        code: 'HR',
        name: 'Nhân sự (HR)',
        description: 'Quản trị nhân sự hệ thống',
        isSystem: true,
      },
    });
    console.log('✅ Created Role HR');
  }

  // 2. Department HCNS / HR
  let hrDept = await prisma.department.findFirst({
    where: {
      OR: [
        { code: { contains: 'HR' } },
        { code: { contains: 'HCNS' } },
        { name: { contains: 'Nhân sự' } },
        { name: { contains: 'Hành chính' } },
      ],
    },
  });
  if (!hrDept) {
    const company = await prisma.company.findFirst();
    const branch = await prisma.branch.findFirst();
    if (!company) throw new Error('No company found in database');
    hrDept = await prisma.department.create({
      data: {
        code: 'DEPT_HR',
        name: 'Phòng Hành chính Nhân sự',
        description: 'Phòng quản lý và điều hành nhân sự',
        companyId: company.id,
        branchId: branch?.id,
      },
    });
    console.log('✅ Created Department Phòng Hành chính Nhân sự');
  }

  // 3. Position HR
  let posHR = await prisma.position.findFirst({
    where: {
      OR: [
        { code: { contains: 'HR' } },
        { name: { contains: 'Nhân sự' } },
      ],
    },
  });
  if (!posHR) {
    posHR = await prisma.position.create({
      data: {
        code: 'POS_HR',
        name: 'Chuyên viên Nhân sự',
        departmentId: hrDept.id,
      },
    });
    console.log('✅ Created Position Chuyên viên Nhân sự');
  }

  // 4. Create or update User
  const hash = await bcrypt.hash(pass, 12);
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    let userCode = 'NV000009';
    try {
      const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
      if (rows?.[0]?.nextval) {
        userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
      }
    } catch {
      const count = await prisma.user.count();
      userCode = `NV${(count + 1).toString().padStart(6, '0')}`;
    }

    user = await prisma.user.create({
      data: {
        userCode,
        phone,
        email,
        passwordHash: hash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        profile: {
          create: {
            fullName,
            idCardNumber: `CCCD-${phone}`,
            employmentStatus: EmploymentStatus.OFFICIAL,
            positionId: posHR.id,
          },
        },
      },
    });
    console.log(`✅ Created User ${fullName} (${user.userCode}, ${phone})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        accountStatus: AccountStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        email: email || user.email,
        profile: {
          upsert: {
            create: {
              fullName,
              idCardNumber: `CCCD-${phone}`,
              employmentStatus: EmploymentStatus.OFFICIAL,
              positionId: posHR.id,
            },
            update: {
              fullName,
              positionId: posHR.id,
            },
          },
        },
      },
    });
    console.log(`🔄 Updated User ${fullName} (${user.userCode}, ${phone})`);
  }

  // 5. UserRole
  const existingRole = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: hrRole.id },
  });
  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: hrRole.id,
        scopeType: RoleScopeType.GLOBAL,
      },
    });
    console.log(`✅ Assigned HR role to ${phone}`);
  }

  // 6. DepartmentMember
  await prisma.departmentMember.upsert({
    where: {
      departmentId_userId: {
        departmentId: hrDept.id,
        userId: user.id,
      },
    },
    update: {
      positionId: posHR.id,
      isPrimary: true,
      leftAt: null,
    },
    create: {
      departmentId: hrDept.id,
      userId: user.id,
      positionId: posHR.id,
      isPrimary: true,
    },
  });
  console.log(`📌 Linked ${phone} to department: ${hrDept.name}`);

  return { user, phone, pass, fullName, role: 'HR', dept: hrDept.name };
}

// Thử tạo tài khoản trên Remote VPS API nếu có thể kết nối
async function syncRemoteVps(phone: string, fullName: string, email: string, pass: string) {
  const VPS_URL = 'http://180.93.165.243:3000/api/v1';
  try {
    console.log(`\n⏳ Đang kiểm tra đồng bộ lên VPS Server (${VPS_URL})...`);
    // 1. Thử đăng nhập Admin trên VPS
    const adminLoginRes = await fetch(`${VPS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0900000000', password: 'admin123' }),
      signal: AbortSignal.timeout(5000),
    });

    if (!adminLoginRes.ok) {
      console.log('⚠️ Không thể đăng nhập Admin trên VPS');
      return;
    }

    const adminData = await adminLoginRes.json();
    const token = adminData.data?.accessToken || adminData.accessToken;
    if (!token) {
      console.log('⚠️ Không nhận được accessToken từ VPS');
      return;
    }
    console.log('✅ Đã kết nối Admin thành công tới VPS Server!');

    // 2. Lấy danh sách Roles trên VPS
    let hrRoleId: string | null = null;
    try {
      const rolesRes = await fetch(`${VPS_URL}/roles`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        const roleList = rolesData.data || rolesData || [];
        const found = roleList.find((r: any) => r.code === 'HR');
        if (found) hrRoleId = found.id;
      }
    } catch {}

    // 3. Lấy danh sách phòng ban trên VPS
    let hrDeptId: string | null = null;
    try {
      const deptsRes = await fetch(`${VPS_URL}/departments`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        const deptList = deptsData.data || deptsData || [];
        const found = deptList.find((d: any) => 
          (d.name && d.name.toLowerCase().includes('nhân sự')) ||
          (d.code && d.code.toUpperCase().includes('HR')) ||
          (d.name && d.name.toLowerCase().includes('hành chính'))
        );
        if (found) hrDeptId = found.id;
      }
    } catch {}

    // 4. Tạo User trên VPS
    let userId: string | null = null;
    const createRes = await fetch(`${VPS_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        phone,
        password: pass,
        fullName,
        email,
        ...(hrDeptId ? { departmentId: hrDeptId } : {}),
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (createRes.ok) {
      const createdData = await createRes.json();
      userId = createdData.data?.id || createdData.id;
      console.log(`🎉 Đã tạo thành công tài khoản HR trên VPS Server! (${phone})`);
    } else {
      // Tìm user xem đã có chưa
      const searchRes = await fetch(`${VPS_URL}/admin/users?search=${phone}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (searchRes.ok) {
        const sData = await searchRes.json();
        const items = sData.data?.items || sData.data || sData.items || [];
        const existing = items.find((u: any) => u.phone === phone);
        if (existing) {
          userId = existing.id;
          console.log(`ℹ️ Tài khoản đã tồn tại trên VPS: ${phone} (ID: ${userId})`);
        }
      }
    }

    // 5. Gán Role HR trên VPS nếu có roleId và userId
    if (userId && hrRoleId) {
      const assignRes = await fetch(`${VPS_URL}/admin/roles/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          roleId: hrRoleId,
          scopeType: 'GLOBAL',
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (assignRes.ok) {
        console.log(`🎯 Đã gán Role HR thành công cho tài khoản ${phone} trên VPS!`);
      }
    }

    // 6. Kích hoạt tài khoản ACTIVE nếu đang PENDING
    if (userId) {
      await fetch(`${VPS_URL}/employees/${userId}/account-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'ACTIVE' }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    }

  } catch (e: any) {
    console.log(`ℹ️ Không thể gọi trực tiếp VPS API từ máy local:`, e.message);
  }
}

async function main() {
  console.log('=== TIẾN HÀNH TẠO TÀI KHOẢN HR (NHÂN SỰ) ===\n');

  // Tài khoản HR 1: 0347941049
  const hr1 = await createOrUpdateHrUser(
    '0347941049',
    'Nguyễn Thu Hà (Chuyên viên Nhân sự)',
    'hr.0347941049@movielegend.vn',
    'admin123'
  );

  // Tài khoản HR 2: 0900000009
  const hr2 = await createOrUpdateHrUser(
    '0900000009',
    'Trần Thu Trang (HR Movie Legend)',
    'hr@movielegend.vn',
    'admin123'
  );

  await syncRemoteVps(hr1.phone, hr1.fullName, hr1.user.email || '', hr1.pass);
  await syncRemoteVps(hr2.phone, hr2.fullName, hr2.user.email || '', hr2.pass);

  console.log('\n======================================================');
  console.log('✨ DANH SÁCH TÀI KHOẢN HR ĐÃ TẠO SẴN SÀNG ĐĂNG NHẬP:');
  console.log('------------------------------------------------------');
  console.log('1. TÀI KHOẢN HR CHÍNH:');
  console.log(`   - Số điện thoại : ${hr1.phone}`);
  console.log(`   - Mật khẩu      : ${hr1.pass}`);
  console.log(`   - Họ và tên     : ${hr1.fullName}`);
  console.log(`   - Vai trò       : HR (Toàn quyền quản trị nhân sự)`);
  console.log(`   - Phòng ban     : ${hr1.dept}`);
  console.log('------------------------------------------------------');
  console.log('2. TÀI KHOẢN HR PHỤ / DEMO:');
  console.log(`   - Số điện thoại : ${hr2.phone}`);
  console.log(`   - Mật khẩu      : ${hr2.pass}`);
  console.log(`   - Họ và tên     : ${hr2.fullName}`);
  console.log(`   - Vai trò       : HR (Toàn quyền quản trị nhân sự)`);
  console.log(`   - Phòng ban     : ${hr2.dept}`);
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Lỗi khi tạo tài khoản HR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
