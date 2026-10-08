const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACCOUNTING_ROLES = [
  {
    code: 'ACCOUNTANT',
    name: 'Kế toán',
    description: 'Vai trò Kế toán chung hệ thống'
  },
  {
    code: 'ACCOUNTANT_LEAD',
    name: 'Kế toán trưởng',
    description: 'Kế toán trưởng - Toàn quyền quản trị tài chính, phê duyệt lương, thưởng và chi tiêu'
  },
  {
    code: 'ACCOUNTANT_PAYROLL',
    name: 'Kế toán lương',
    description: 'Kế toán lương - Chuyên trách tính lương, phụ cấp, bảo hiểm, thưởng phạt và báo cáo OT'
  },
  {
    code: 'ACCOUNTANT_TAX',
    name: 'Kế toán thuế',
    description: 'Kế toán thuế - Chuyên trách báo cáo thuế, hóa đơn chứng từ và hợp đồng lao động'
  },
  {
    code: 'ACCOUNTANT_GENERAL',
    name: 'Kế toán viên',
    description: 'Kế toán viên - Thực hiện các nghiệp vụ thanh toán chi trả và giải ngân tiền thưởng'
  }
];

const ACCOUNTING_POSITIONS = [
  { code: 'POS_ACCOUNTANT_LEAD', name: 'Kế toán trưởng' },
  { code: 'POS_ACCOUNTANT_PAYROLL', name: 'Kế toán lương' },
  { code: 'POS_ACCOUNTANT_TAX', name: 'Kế toán thuế' },
  { code: 'POS_ACCOUNTANT_GENERAL', name: 'Kế toán viên' },
];

async function main() {
  console.log('--- 1. CẬP NHẬT CÁC VAI TRÒ (ROLES) KẾ TOÁN VÀO DATABASE ---');
  for (const r of ACCOUNTING_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: true
      },
      update: {
        name: r.name,
        description: r.description
      }
    });
    console.log(` ✅ Role [${role.code}] - ${role.name}`);
  }

  console.log('\n--- 2. CẬP NHẬT CÁC VỊ TRÍ CHỨC DANH (POSITIONS) KẾ TOÁN ---');
  const accountingDept = await prisma.department.findFirst({
    where: {
      name: { contains: 'KẾ TOÁN', mode: 'insensitive' }
    }
  });

  for (const pos of ACCOUNTING_POSITIONS) {
    const p = await prisma.position.upsert({
      where: { code: pos.code },
      create: {
        code: pos.code,
        name: pos.name,
        departmentId: accountingDept?.id || null,
        isActive: true
      },
      update: {
        name: pos.name,
        departmentId: accountingDept?.id || null,
        isActive: true
      }
    });
    console.log(` ✅ Position [${p.code}] - ${p.name}`);
  }

  // Đồng bộ thành viên phòng kế toán
  if (accountingDept) {
    console.log(`\n--- 3. ĐỒNG BỘ THÀNH VIÊN PHÒNG KẾ TOÁN: ${accountingDept.name} ---`);
    const members = await prisma.departmentMember.findMany({
      where: { departmentId: accountingDept.id },
      include: { user: { include: { profile: true, roles: { include: { role: true } } } } }
    });

    for (const m of members) {
      const isLeader = accountingDept.leaderUserId === m.userId;
      const subRoleCode = isLeader ? 'ACCOUNTANT_LEAD' : 'ACCOUNTANT_GENERAL';
      const posCode = isLeader ? 'POS_ACCOUNTANT_LEAD' : 'POS_ACCOUNTANT_GENERAL';
      
      const targetRole = await prisma.role.findUnique({ where: { code: subRoleCode } });
      const baseRole = await prisma.role.findUnique({ where: { code: 'ACCOUNTANT' } });
      const targetPos = await prisma.position.findUnique({ where: { code: posCode } });

      if (baseRole) {
        const existBase = await prisma.userRole.findFirst({
          where: { userId: m.userId, roleId: baseRole.id, scopeType: 'GLOBAL' }
        });
        if (!existBase) {
          await prisma.userRole.create({
            data: { userId: m.userId, roleId: baseRole.id, scopeType: 'GLOBAL' }
          });
        }
      }

      if (targetRole) {
        const existTarget = await prisma.userRole.findFirst({
          where: { userId: m.userId, roleId: targetRole.id, scopeType: 'GLOBAL' }
        });
        if (!existTarget) {
          await prisma.userRole.create({
            data: { userId: m.userId, roleId: targetRole.id, scopeType: 'GLOBAL' }
          });
        }
      }

      if (targetPos) {
        if (m.user.profile) {
          await prisma.employeeProfile.update({
            where: { id: m.user.profile.id },
            data: { positionId: targetPos.id }
          });
        }
        await prisma.departmentMember.update({
          where: { id: m.id },
          data: { positionId: targetPos.id }
        });
      }

      console.log(` -> Nhân sự: ${m.user.userCode} - ${m.user.profile?.fullName}: Chức vụ [${isLeader ? 'Kế toán trưởng' : 'Kế toán viên'}]`);
    }
  }

  console.log('\n🎉 HOÀN TẤT THIẾT LẬP CÁC CHỨC NĂNG PHÒNG KẾ TOÁN!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
