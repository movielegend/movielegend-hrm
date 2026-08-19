const { PrismaClient } = require('@prisma/client');

async function checkAdmin() {
  console.log('--- Checking Local Database ---');
  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:210203@127.0.0.1:5432/movielegend_hrm?schema=public"
      }
    }
  });

  try {
    const users = await localPrisma.user.findMany({
      where: {
        OR: [
          { phone: '0900000000' },
          { roles: { some: { role: { code: 'ADMIN' } } } }
        ]
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`Local Admin Users Found (${users.length}):`);
    users.forEach(u => {
      console.log(`- ID: ${u.id} | Phone: ${u.phone} | Name: ${u.fullName} | Status: ${u.accountStatus} | Approval: ${u.approvalStatus}`);
    });
  } catch (err) {
    console.error('Error querying local db:', err.message);
  } finally {
    await localPrisma.$disconnect();
  }

  console.log('\n--- Checking Render Database ---');
  const renderPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm"
      }
    }
  });

  try {
    const renderUsers = await renderPrisma.user.findMany({
      where: {
        OR: [
          { phone: '0900000000' },
          { roles: { some: { role: { code: 'ADMIN' } } } }
        ]
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`Render Admin Users Found (${renderUsers.length}):`);
    renderUsers.forEach(u => {
      console.log(`- ID: ${u.id} | Phone: ${u.phone} | Name: ${u.fullName} | Status: ${u.accountStatus} | Approval: ${u.approvalStatus}`);
    });
  } catch (err) {
    console.error('Error querying render db:', err.message);
  } finally {
    await renderPrisma.$disconnect();
  }
}

checkAdmin();
