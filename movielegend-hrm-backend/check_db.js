const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public';
    `;
    const tableNames = result.map(r => r.table_name);
    console.log('=== Danh sách các bảng đang có trong Database ===');
    console.log(tableNames.filter(t => t.includes('asset')));
    console.log('Có bảng asset_incident_reports chưa?:', tableNames.includes('asset_incident_reports'));
  } catch (e) {
    console.error('Lỗi kết nối DB:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
