import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU TẠO DỮ LIỆU TEST ---');

  // 1. Company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { code: 'TEST_COMP', name: 'Công ty Test' }
    });
  }

  // 2. Chi nhánh HN
  let branch = await prisma.branch.findFirst({ where: { name: { contains: 'Hà Nội' } } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        companyId: company.id,
        code: 'HN_TEST',
        name: 'Chi nhánh Hà Nội - Test',
        address: 'Hà Nội',
        isActive: true,
      }
    });
  }

  // 3. Tạo Phòng ban
  let department = await prisma.department.findFirst({ where: { name: 'Phòng ban Test Điểm danh' } });
  if (!department) {
    department = await prisma.department.create({
      data: {
        companyId: company.id,
        code: 'DEP_TEST',
        name: 'Phòng ban Test Điểm danh',
        branchId: branch.id,
        isActive: true,
      }
    });
  }

  // 4. Tạo Mật khẩu chung
  const passwordHash = await bcrypt.hash('123456789', 10);

  // Lấy role (nếu schema yêu cầu role qua bảng UserRole, ở đây cứ bỏ qua role tạo trước, hệ thống có thể yêu cầu role)
  // Thực tế nếu `roles` trên User là enum array thì dùng: roles: [isLeader ? 'LEADER' : 'EMPLOYEE']
  // Nhưng nếu nó không có mảng roles, mình bỏ qua tạm, chỉ tạo User thường.
  // Wait, I saw earlier "roles: [userRole]" caused "Type 'string[]' is not assignable to type 'UserRoleUncheckedCreateNestedManyWithoutUserInput'". This means `roles` is a relation to UserRole.

  // 5. Tạo 8 User
  const users = [];
  for (let i = 1; i <= 8; i++) {
    const isLeader = i === 1;
    const email = `testuser${i}@example.com`;
    
    await prisma.user.deleteMany({ where: { email } });

    const user = await prisma.user.create({
      data: {
        phone: `090000000${i}`,
        email,
        passwordHash,
        isActive: true,
        userCode: `TEST${i.toString().padStart(3, '0')}`,
        profile: {
          create: {
            fullName: isLeader ? 'Trưởng phòng Test' : `Nhân viên Test ${i - 1}`,
            idCardNumber: `00120000000${i}`,
          }
        },
        departmentLinks: {
          create: {
            departmentId: department!.id,
            isPrimary: true,
          }
        }
      }
    });
    users.push(user);
  }

  // 6. Tạo Ca làm việc
  let shift = await prisma.shift.findFirst({ where: { code: 'SHIFT_TEST_2H' } });
  if (!shift) {
    shift = await prisma.shift.create({
      data: {
        code: 'SHIFT_TEST_2H',
        name: 'Ca Chiều 15:00 - 17:00 (Test)',
        startTime: '15:00:00',
        endTime: '17:00:00',
        isActive: true,
        checkInEarlyMinutes: 60,
        checkInLateMinutes: 120, 
        checkOutLateMinutes: 240,
      }
    });
  }

  // 7. Xếp ca
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 

  for (const user of users) {
    if (user.email === 'testuser7@example.com') continue;

    await prisma.shiftAssignment.create({
      data: {
        userId: user.id,
        departmentId: department.id,
        shiftId: shift.id,
        workDate: today,
        status: 'ASSIGNED',
      }
    });
  }
  
  console.log('Tạo dữ liệu thành công!');
  console.log(`Chi nhánh: ${branch.name}`);
  console.log(`Phòng ban: ${department.name}`);
  console.log(`Ca làm: ${shift.name}`);
  console.log(`Leader Email: testuser1@example.com`);
  for (let i = 2; i <= 8; i++) {
    console.log(`Member Email: testuser${i}@example.com`);
  }
  console.log('Mật khẩu chung cho tất cả: 123456789');
  console.log('User 7 không có ca để Test OT');
  console.log('--- HOÀN TẤT ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
