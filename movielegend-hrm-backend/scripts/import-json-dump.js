const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ORDERED_TABLES = [
  'companies',
  'regions',
  'branches',
  'roles',
  'permissions',
  'role_permissions',
  'users',
  'user_roles',
  'employee_profiles',
  'departments',
  'department_members',
  'department_overtime_configs',
  'positions',
  'uploaded_files',
  'face_profiles',
  'face_registration_images',
  'contract_templates',
  'contract_template_versions',
  'contract_field_presets',
  'employee_contracts',
  'contract_signatures',
  'department_documents',
  'leave_types',
  'attendance_records',
  'attendance_verifications',
  'user_approval_requests',
  'approval_histories',
  'employee_requests',
  'tasks',
  'task_targets',
  'task_assignments',
  'task_comments',
  'task_attachments',
  'task_extension_requests',
  'task_status_histories',
  'chat_groups',
  'chat_group_members',
  'chat_messages',
  'newsfeed_posts',
  'notifications',
  'notification_targets',
  'notification_deliveries',
  'device_tokens',
  'feedbacks',
  'job_postings',
  'job_applications',
  'refresh_sessions',
  'audit_logs'
];

async function importDump() {
  const dumpPath = path.resolve(__dirname, '../../../movielegend_hrm_export_2026-10-08T07-51-47.json');
  console.log('Reading dump file from:', dumpPath);
  
  if (!fs.existsSync(dumpPath)) {
    console.error('File not found:', dumpPath);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(dumpPath, 'utf8');
  const dump = JSON.parse(fileContent);
  const data = dump.data;

  console.log('--- 1. TRUNCATING ALL TABLES ---');
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `);
    if (tables && tables.length > 0) {
      const tableList = tables.map(t => `"${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE;`);
      console.log('Truncated all tables successfully!');
    }
  } catch (err) {
    console.error('Error truncating tables:', err.message);
  }

  console.log('--- 2. FETCHING SCHEMA COLUMN TYPES ---');
  const columnsInfo = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public';
  `);

  const schemaMap = {};
  for (const col of columnsInfo) {
    if (!schemaMap[col.table_name]) schemaMap[col.table_name] = {};
    schemaMap[col.table_name][col.column_name] = {
      dataType: col.data_type,
      udtName: col.udt_name
    };
  }

  console.log('--- 3. INSERTING DATA IN STRICT TOPOLOGICAL ORDER ---');

  // Any remaining table not in ORDERED_TABLES
  const allActiveTables = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length > 0);
  const finalOrderedTables = [
    ...ORDERED_TABLES.filter(t => allActiveTables.includes(t)),
    ...allActiveTables.filter(t => !ORDERED_TABLES.includes(t))
  ];

  for (const tableName of finalOrderedTables) {
    const rows = data[tableName];
    if (!rows || rows.length === 0) continue;

    const tableSchema = schemaMap[tableName];
    if (!tableSchema) {
      console.warn(`Table schema not found for ${tableName}, skipping...`);
      continue;
    }

    console.log(`Inserting ${rows.length} rows into "${tableName}"...`);

    let successCount = 0;
    let failCount = 0;

    for (const row of rows) {
      const validCols = Object.keys(row).filter(k => tableSchema[k]);
      if (validCols.length === 0) continue;

      const columnsSql = validCols.map(k => `"${k}"`).join(', ');
      
      const values = [];
      const placeholders = validCols.map((colName, idx) => {
        const val = row[colName];
        const colMeta = tableSchema[colName];
        
        let placeholder = `$${idx + 1}`;

        if (colMeta.udtName === 'uuid') {
          placeholder += '::uuid';
          values.push(val === null || val === undefined ? null : String(val));
        } else if (colMeta.dataType === 'USER-DEFINED') {
          // Enum type
          placeholder += `::"${colMeta.udtName}"`;
          values.push(val === null || val === undefined ? null : String(val));
        } else if (colMeta.udtName.startsWith('_')) {
          // Array type
          const elemUdt = colMeta.udtName.substring(1);
          placeholder += `::${elemUdt}[]`;
          values.push(val === null || val === undefined ? null : val);
        } else if (colMeta.dataType === 'date') {
          placeholder += '::date';
          if (!val) {
            values.push(null);
          } else if (typeof val === 'string') {
            values.push(val.split('T')[0]);
          } else {
            values.push(new Date(val).toISOString().split('T')[0]);
          }
        } else if (colMeta.dataType.includes('timestamp')) {
          placeholder += '::timestamptz';
          values.push(val === null || val === undefined ? null : (val ? new Date(val).toISOString() : null));
        } else if (colMeta.dataType === 'boolean') {
          placeholder += '::boolean';
          values.push(val === null || val === undefined ? null : Boolean(val));
        } else if (colMeta.dataType === 'integer' || colMeta.dataType === 'smallint') {
          placeholder += '::integer';
          values.push(val === null || val === undefined ? null : Number(val));
        } else if (colMeta.dataType === 'numeric' || colMeta.dataType === 'decimal') {
          placeholder += '::numeric';
          values.push(val === null || val === undefined ? null : (val !== null ? String(val) : null));
        } else if (colMeta.dataType === 'jsonb' || colMeta.dataType === 'json') {
          placeholder += '::jsonb';
          values.push(val === null || val === undefined ? null : JSON.stringify(val));
        } else {
          values.push(val === null || val === undefined ? null : String(val));
        }

        return placeholder;
      }).join(', ');

      const query = `INSERT INTO "${tableName}" (${columnsSql}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
      try {
        await prisma.$executeRawUnsafe(query, ...values);
        successCount++;
      } catch (err) {
        failCount++;
        if (failCount <= 3) {
          console.warn(`Error inserting in ${tableName}:`, err.message);
        }
      }
    }
    console.log(`  -> "${tableName}": ${successCount} success, ${failCount} failed`);
  }

  // Restart sequences
  console.log('--- 4. RESTARTING SEQUENCES ---');
  const allSeqs = [
    'user_code_seq',
    'task_code_seq',
    'cross_department_request_code_seq',
    'contract_code_seq',
    'warehouse_code_seq',
    'asset_code_seq',
    'stock_receipt_code_seq',
    'material_issue_code_seq',
    'stock_transfer_code_seq',
    'stock_transaction_code_seq',
    'inventory_check_code_seq',
    'payroll_period_code_seq',
    'material_code_seq',
  ];
  for (const seq of allSeqs) {
    try {
      await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${seq}" START WITH 1 INCREMENT BY 1;`);
    } catch (e) {}
  }

  const users = await prisma.user.findMany({ select: { userCode: true } });
  let maxUserNum = 1;
  for (const u of users) {
    if (u.userCode && u.userCode.startsWith('NV')) {
      const num = parseInt(u.userCode.replace('NV', ''), 10);
      if (!isNaN(num) && num > maxUserNum) maxUserNum = num;
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('user_code_seq', ${maxUserNum + 1}, false);`);
  console.log(`user_code_seq set to ${maxUserNum + 1}`);

  const userCount = await prisma.user.count();
  const deptCount = await prisma.department.count();
  const roleCount = await prisma.role.count();
  console.log(`\n======================================================`);
  console.log(`🎉 DATA IMPORT COMPLETED SUCCESSFULLY!`);
  console.log(`📊 Users: ${userCount} | Departments: ${deptCount} | Roles: ${roleCount}`);
  console.log(`======================================================\n`);
}

importDump()
  .catch(err => {
    console.error('Fatal error during import:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
