import { PrismaClient, AccountStatus, ApprovalStatus, EmploymentStatus, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hrPhone = '0900000001';
  const hrPassword = 'hr123456';
  const passwordHash = await bcrypt.hash(hrPassword, 12);

  console.log('Creating HR role...');
  const hrRole = await prisma.role.upsert({
    where: { code: 'HR' },
    update: {},
    create: { code: 'HR', name: 'Nhân sự (HR)' },
  });

  const adminRole = await prisma.role.findUnique({
    where: { code: 'ADMIN' },
  });

  console.log('Creating HR user...');
  const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
  const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
  
  const hrUser = await prisma.user.upsert({
    where: { phone: hrPhone },
    update: {
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
    create: {
      userCode,
      phone: hrPhone,
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      profile: {
        create: {
          fullName: 'HR Manager',
          idCardNumber: `HR-${Date.now()}`,
          employmentStatus: EmploymentStatus.OFFICIAL,
        },
      },
    },
  });

  console.log('Assigning HR role...');
  const existingHrRole = await prisma.userRole.findFirst({
    where: {
      userId: hrUser.id,
      roleId: hrRole.id,
      scopeType: RoleScopeType.GLOBAL,
      scopeId: null,
    },
  });
  if (!existingHrRole) {
    await prisma.userRole.create({
      data: {
        userId: hrUser.id,
        roleId: hrRole.id,
        scopeType: RoleScopeType.GLOBAL,
      },
    });
  }

  if (adminRole) {
    console.log('Assigning ADMIN role (inheritance)...');
    const existingAdminRole = await prisma.userRole.findFirst({
      where: {
        userId: hrUser.id,
        roleId: adminRole.id,
        scopeType: RoleScopeType.GLOBAL,
        scopeId: null,
      },
    });
    if (!existingAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: hrUser.id,
          roleId: adminRole.id,
          scopeType: RoleScopeType.GLOBAL,
        },
      });
    }
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
