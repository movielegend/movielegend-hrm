import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../src/database/prisma.service';
import { DepartmentScopeService } from '../src/modules/phase2-policy/department-scope.service';
import { BusinessTimeService } from '../src/modules/time/business-time.service';
import { EmployeeRequestsService } from '../src/modules/employee-requests/employee-requests.service';

async function exportExcel() {
  console.log('🚀 Đang kết nối database và xuất file Excel giao dịch...');

  const prisma = new PrismaService();
  await prisma.$connect();
  const scope = new DepartmentScopeService(prisma);
  const businessTime = new BusinessTimeService();

  const mockNotifications: any = {
    create: async () => ({}),
    createForUsers: async () => ({}),
    createForDepartment: async () => ({}),
    emitCreated: () => {},
    sendToUsers: async () => {},
    sendToDepartment: async () => {},
  };

  const requestsService = new EmployeeRequestsService(prisma, scope, businessTime, mockNotifications);

  // Tìm tài khoản Admin hoặc Kế toán trưởng
  const ktLeader = await prisma.user.findFirst({
    where: {
      OR: [
        { roles: { some: { role: { code: 'ADMIN' } } } },
        { roles: { some: { role: { code: 'ACCOUNTANT_LEAD' } } } },
      ],
    },
    include: { profile: true },
  });

  const actor = {
    userId: ktLeader?.id || 'admin-id',
    userCode: ktLeader?.userCode || 'ADMIN',
    roles: ['ADMIN', 'ACCOUNTANT_LEAD'],
    scopes: [],
    isDirector: true,
  };

  // Xuất dữ liệu (tất cả đơn tài chính)
  const result = await requestsService.exportDailyTransactions({ date: 'ALL' }, actor as any);

  // Lưu file ra ngoài thư mục dự án
  const outDir = path.resolve(__dirname, '../../..');
  const targetPath = path.join(outDir, `De-xuat-mua-hang-HCNS-Ke-toan-${Date.now()}.xlsx`);
  fs.writeFileSync(targetPath, result.buffer);

  console.log(`✅ Xuất thành công file Excel!`);
  console.log(`📁 Đường dẫn file: ${targetPath}`);

  await prisma.$disconnect();
}

exportExcel().catch((err) => {
  console.error('❌ Lỗi xuất file Excel:', err);
  process.exit(1);
});
