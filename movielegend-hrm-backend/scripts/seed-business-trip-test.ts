import { PrismaClient, EmployeeRequestStatus, EmployeeRequestType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Business Trip Test Data ---');
  
  // Find an active employee user
  const employee = await prisma.user.findFirst({
    where: {
      isActive: true,
      roles: {
        some: {
          role: {
            code: { in: ['EMPLOYEE', 'LEADER', 'HR', 'ADMIN'] }
          }
        }
      }
    },
    include: {
      profile: true,
      departmentLinks: {
        include: { department: true }
      }
    }
  });

  if (!employee) {
    console.error('No active user found in database.');
    return;
  }

  const dept = employee.departmentLinks[0]?.department;
  console.log(`Found user: ${employee.profile?.fullName || employee.phone} (${employee.userCode}) in dept: ${dept?.name || 'N/A'}`);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 3);

  const sampleImages = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80'
  ];

  // 1. Create a PENDING Business Trip Request
  const pendingTrip = await prisma.employeeRequest.create({
    data: {
      userId: employee.id,
      departmentId: dept?.id || null,
      type: EmployeeRequestType.BUSINESS_TRIP,
      status: EmployeeRequestStatus.PENDING,
      title: `Đi công tác: Chi nhánh Đà Nẵng (${tomorrow.toLocaleDateString('vi-VN')} - ${dayAfter.toLocaleDateString('vi-VN')})`,
      content: 'Đi công tác làm việc với đối tác tại chi nhánh Đà Nẵng, khảo sát địa điểm ghi hình và đào tạo quy trình vận hành cho đội ngũ nhân sự mới.',
      attachmentMetadata: {
        location: 'Chi nhánh Đà Nẵng, 123 Nguyễn Văn Linh, Q. Hải Châu',
        fromDate: tomorrow.toISOString(),
        toDate: dayAfter.toISOString(),
        startTime: new Date(tomorrow.setHours(8, 0, 0, 0)).toISOString(),
        endTime: new Date(dayAfter.setHours(17, 30, 0, 0)).toISOString(),
        images: sampleImages,
        image: sampleImages[0],
        stage: 'PENDING_LEADER'
      }
    }
  });

  console.log('✅ Created Pending Business Trip Request:', pendingTrip.id);
  console.log('Title:', pendingTrip.title);

  // 2. Create an already APPROVED Business Trip Request for past days to demonstrate attendance record
  const pastStart = new Date(today);
  pastStart.setDate(today.getDate() - 5);
  const pastEnd = new Date(today);
  pastEnd.setDate(today.getDate() - 3);

  const approvedTrip = await prisma.employeeRequest.create({
    data: {
      userId: employee.id,
      departmentId: dept?.id || null,
      type: EmployeeRequestType.BUSINESS_TRIP,
      status: EmployeeRequestStatus.APPROVED,
      title: `Đi công tác: Khách hàng Hồ Chí Minh (${pastStart.toLocaleDateString('vi-VN')} - ${pastEnd.toLocaleDateString('vi-VN')})`,
      content: 'Gặp gỡ và ký kết hợp đồng tài trợ truyền thông tại VP đối tác Q.1, TP.HCM.',
      decidedAt: new Date(),
      attachmentMetadata: {
        location: 'Tòa nhà Bitexco, Q.1, TP. Hồ Chí Minh',
        fromDate: pastStart.toISOString(),
        toDate: pastEnd.toISOString(),
        startTime: new Date(pastStart.setHours(8, 0, 0, 0)).toISOString(),
        endTime: new Date(pastEnd.setHours(17, 30, 0, 0)).toISOString(),
        images: [sampleImages[1]],
        image: sampleImages[1],
        stage: 'DISBURSED'
      }
    }
  });

  console.log('✅ Created Approved Business Trip Request:', approvedTrip.id);
  console.log('Title:', approvedTrip.title);

  console.log('\n--- Seed Business Trip Test Data Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
