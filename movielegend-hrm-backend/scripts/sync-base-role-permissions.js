const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Connecting to database...');
    
    // 1. Get EMPLOYEE role and its permissions
    const employeeRole = await prisma.role.findUnique({
      where: { code: 'EMPLOYEE' },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });

    if (!employeeRole) {
      throw new Error('EMPLOYEE role not found in database');
    }

    const basePermissions = employeeRole.permissions.map(p => p.permission);
    console.log(`Found ${basePermissions.length} base employee permissions.`);

    // 2. Roles that must inherit base employee permissions
    const targetRoleCodes = ['LEADER', 'HR', 'ACCOUNTANT', 'WAREHOUSE_MANAGER'];
    const targetRoles = await prisma.role.findMany({
      where: { code: { in: targetRoleCodes } },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });

    let totalAdded = 0;

    for (const role of targetRoles) {
      const existingPermissionIds = new Set(role.permissions.map(p => p.permissionId));
      const missingPermissions = basePermissions.filter(p => !existingPermissionIds.has(p.id));

      console.log(`Role ${role.code} (ID: ${role.id}): has ${existingPermissionIds.size} permissions, adding ${missingPermissions.length} missing base permissions...`);

      for (const perm of missingPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id
          }
        });
        totalAdded++;
      }
    }

    console.log(`\n Successfully added ${totalAdded} role permissions across ${targetRoles.length} roles.`);

    // 3. Verify permissions after update
    for (const code of targetRoleCodes) {
      const updatedRole = await prisma.role.findUnique({
        where: { code },
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      });
      const hasTaskReadOwn = updatedRole.permissions.some(p => p.permission.code === 'task.read_own');
      const hasCheckin = updatedRole.permissions.some(p => p.permission.code === 'attendance.checkin');
      const hasLeaveReq = updatedRole.permissions.some(p => p.permission.code === 'leave.request');
      console.log(`Verification for ${code}: Total perms = ${updatedRole.permissions.length} | task.read_own = ${hasTaskReadOwn} | attendance.checkin = ${hasCheckin} | leave.request = ${hasLeaveReq}`);
    }

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Error syncing base role permissions:', err);
  process.exit(1);
});
