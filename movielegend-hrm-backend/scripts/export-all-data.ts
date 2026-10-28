import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function customSerializer(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

async function exportAllData() {
  console.log('🚀 Bắt đầu trích xuất toàn bộ dữ liệu từ Database...');
  
  // 1. Lấy danh sách tất cả các bảng trong schema public
  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations'
    ORDER BY table_name ASC;
  `;

  console.log(`📋 Tìm thấy tổng cộng ${tables.length} bảng trong Database.`);

  const exportResult: {
    metadata: {
      exportedAt: string;
      system: string;
      totalTables: number;
      totalRecords: number;
      tableStats: Record<string, number>;
    };
    data: Record<string, any[]>;
  } = {
    metadata: {
      exportedAt: new Date().toISOString(),
      system: 'MovieLegend HRM Database Export',
      totalTables: tables.length,
      totalRecords: 0,
      tableStats: {},
    },
    data: {},
  };

  let totalRecords = 0;

  for (const t of tables) {
    const tableName = t.table_name;
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
      exportResult.data[tableName] = rows;
      exportResult.metadata.tableStats[tableName] = rows.length;
      totalRecords += rows.length;
      console.log(` ✅ Bảng [${tableName}]: ${rows.length} bản ghi`);
    } catch (err: any) {
      console.error(` ❌ Lỗi khi đọc bảng [${tableName}]:`, err.message);
      exportResult.data[tableName] = [];
      exportResult.metadata.tableStats[tableName] = -1;
    }
  }

  exportResult.metadata.totalRecords = totalRecords;

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Lưu vào 2 nơi: thư mục backups và thư mục gốc của project
  const backupDir = path.resolve(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `movielegend_hrm_export_${dateStr}.json`);
  const rootFilePath = path.resolve(__dirname, '../../movielegend_hrm_all_data.json');

  const jsonContent = JSON.stringify(exportResult, customSerializer, 2);

  fs.writeFileSync(backupFilePath, jsonContent, 'utf-8');
  fs.writeFileSync(rootFilePath, jsonContent, 'utf-8');

  console.log('\n=========================================');
  console.log('🎉 XUẤT DỮ LIỆU THÀNH CÔNG!');
  console.log(`📊 Tổng số bảng: ${tables.length}`);
  console.log(`📝 Tổng số bản ghi (records): ${totalRecords}`);
  console.log(`📁 File chính (gốc): ${rootFilePath}`);
  console.log(`📁 File lưu trữ (backup): ${backupFilePath}`);
  console.log(`📦 Kích thước file: ${(Buffer.byteLength(jsonContent, 'utf-8') / (1024 * 1024)).toFixed(2)} MB`);
  console.log('=========================================\n');
}

exportAllData()
  .catch((e) => {
    console.error('Lỗi khi export dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
