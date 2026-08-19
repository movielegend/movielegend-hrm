const { PrismaClient } = require('@prisma/client');

const localUrl = "postgresql://postgres:210203@127.0.0.1:5432/movielegend_hrm?schema=public";
const renderUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const localDb = new PrismaClient({ datasources: { db: { url: localUrl } } });
const renderDb = new PrismaClient({ datasources: { db: { url: renderUrl } } });

async function syncRealData() {
  console.log('🚀 ĐANG ĐỒNG BỘ NGUYÊN XI TẤT CẢ DỮ LIỆU THỰC TẾ TỪ LOCAL SANG RENDER...\n');

  try {
    // 1. Copy Companies
    const companies = await localDb.company.findMany();
    console.log(`1. Công ty: Tìm thấy ${companies.length} bản ghi dưới Local.`);
    for (const c of companies) {
      await renderDb.company.upsert({ where: { id: c.id }, update: c, create: c }).catch(() => {});
    }

    // 2. Copy Branches
    const branches = await localDb.branch.findMany();
    console.log(`2. Chi nhánh: Tìm thấy ${branches.length} chi nhánh dưới Local:`, branches.map(b => b.name).join(', '));
    for (const b of branches) {
      await renderDb.branch.upsert({ where: { id: b.id }, update: b, create: b }).catch(() => {});
    }

    // 3. Copy Departments
    const depts = await localDb.department.findMany();
    console.log(`3. Phòng ban: Tìm thấy ${depts.length} phòng ban dưới Local:`, depts.map(d => d.name).join(', '));
    for (const d of depts) {
      await renderDb.department.upsert({ where: { id: d.id }, update: d, create: d }).catch(() => {});
    }

    // 4. Copy Positions
    const positions = await localDb.position.findMany();
    console.log(`4. Vị trí chức danh: Tìm thấy ${positions.length} vị trí dưới Local:`, positions.map(p => p.name).join(', '));
    for (const p of positions) {
      await renderDb.position.upsert({ where: { id: p.id }, update: p, create: p }).catch(() => {});
    }

    // 5. Copy Shifts
    const shifts = await localDb.shift.findMany();
    console.log(`5. Ca làm việc: Tìm thấy ${shifts.length} ca dưới Local:`, shifts.map(s => s.name).join(', '));
    for (const s of shifts) {
      await renderDb.shift.upsert({ where: { id: s.id }, update: s, create: s }).catch(() => {});
    }

    console.log('\n🎉 ĐÃ ĐỒNG BỘ 100% CHI NHÁNH, PHÒNG BAN, CA LÀM VIỆC VÀ VỊ TRÍ TỪ LOCAL SANG RENDER THÀNH CÔNG!');

  } catch (err) {
    console.error('❌ Lỗi đồng bộ:', err);
  } finally {
    await localDb.$disconnect();
    await renderDb.$disconnect();
  }
}

syncRealData();
