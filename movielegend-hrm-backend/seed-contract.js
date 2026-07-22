require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock E-Signature data...');

  // 1. Get a company to attach to
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found. Please seed basic data first.');
    return;
  }

  // 2. Get an admin user
  const admin = await prisma.user.findFirst(); // Just get the first user to make it easy
  if (!admin) {
    console.error('No user found.');
    return;
  }

  // 3. Delete existing mock template if exists
  const existing = await prisma.contractTemplate.findFirst({ where: { code: 'HDLD-MOCK-001' } });
  if (existing) {
    await prisma.employeeContract.deleteMany({ where: { contractTemplateId: existing.id } });
    await prisma.contractTemplateVersion.deleteMany({ where: { contractTemplateId: existing.id } });
    await prisma.contractTemplate.delete({ where: { id: existing.id } });
  }

  // 4. Create Contract Template
  const template = await prisma.contractTemplate.create({
    data: {
      companyId: company.id,
      code: 'HDLD-MOCK-001',
      name: 'Hợp Đồng Lao Động Mẫu',
      contractType: 'FULL_TIME',
      description: 'Mẫu thử nghiệm E-Signature',
      templateFileUrl: '/uploads/HD_LaoDong_Mau_2026.pdf', // Mock URL
      createdById: admin.id,
      isActive: true,
      versions: {
        create: {
          versionNumber: 1,
          templateFileUrl: '/uploads/HD_LaoDong_Mau_2026.pdf',
          createdById: admin.id,
          mappingConfig: [
            { id: "fullName", label: "Họ và Tên", type: "text", page: 1, x: 150, y: 700 },
            { id: "signature", label: "Ký tên", type: "signature", page: 2, x: 300, y: 100 }
          ]
        }
      }
    },
    include: { versions: true }
  });

  console.log('Created Template:', template.code);
  
  // 5. Create an Employee Contract (Draft) for the admin user
  const contract = await prisma.employeeContract.create({
    data: {
      contractCode: 'HD-EMP-MOCK-' + Date.now(),
      userId: admin.id,
      contractTemplateId: template.id,
      contractTemplateVersionId: template.versions[0].id,
      contractType: 'FULL_TIME',
      title: 'Hợp đồng lao động - Thử nghiệm Ký tên',
      startDate: new Date(),
      status: 'CONTRACT_SIGNATURE_REQUIRED',
      createdById: admin.id
    }
  });
  
  console.log('Created Employee Contract:', contract.contractCode);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
