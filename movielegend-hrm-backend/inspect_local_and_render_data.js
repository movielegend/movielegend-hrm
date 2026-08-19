const { PrismaClient } = require('@prisma/client');

const localUrl = "postgresql://postgres:210203@127.0.0.1:5432/movielegend_hrm?schema=public";
const renderUrl = "postgresql://movielegend_hrm_user:GqhsWu9Lxy7SRE5hv6C4nyg8Jztrbg7O@dpg-da2ieutg1s2s73cqnpm0-a.oregon-postgres.render.com/movielegend_hrm";

const localDb = new PrismaClient({ datasources: { db: { url: localUrl } } });
const renderDb = new PrismaClient({ datasources: { db: { url: renderUrl } } });

async function compareData() {
  console.log('🔍 KIỂM TRA BẢNG CÔNG TY, CHI NHÁNH, PHÒNG BAN...\n');

  try {
    // 1. Branches
    const localBranches = await localDb.branch.findMany();
    const renderBranches = await renderDb.branch.findMany();

    console.log(`🏢 CHI NHÁNH (Branches):`);
    console.log(`   - Under Local (${localBranches.length}):`, localBranches.map(b => `${b.name} (Code: ${b.code})`).join(', '));
    console.log(`   - On Render (${renderBranches.length}):`, renderBranches.map(b => `${b.name} (Code: ${b.code})`).join(', '));

    // 2. Departments
    const localDepts = await localDb.department.findMany();
    const renderDepts = await renderDb.department.findMany();
    console.log(`\n🏬 PHÒNG BAN (Departments):`);
    console.log(`   - Under Local (${localDepts.length}):`, localDepts.map(d => `${d.name} (Code: ${d.code})`).join(', '));
    console.log(`   - On Render (${renderDepts.length}):`, renderDepts.map(d => `${d.name} (Code: ${d.code})`).join(', '));

    // 3. Positions
    const localPositions = await localDb.position.findMany();
    const renderPositions = await renderDb.position.findMany();
    console.log(`\n👔 VỊ TRÍ (Positions):`);
    console.log(`   - Under Local (${localPositions.length}):`, localPositions.map(p => `${p.name} (Code: ${p.code})`).join(', '));
    console.log(`   - On Render (${renderPositions.length}):`, renderPositions.map(p => `${p.name} (Code: ${p.code})`).join(', '));

    // 4. Shifts
    const localShifts = await localDb.shift.findMany();
    const renderShifts = await renderDb.shift.findMany();
    console.log(`\n⏰ CA LÀM VIỆC (Shifts):`);
    console.log(`   - Under Local (${localShifts.length}):`, localShifts.map(s => `${s.name} (${s.startTime}-${s.endTime})`).join(', '));
    console.log(`   - On Render (${renderShifts.length}):`, renderShifts.map(s => `${s.name} (${s.startTime}-${s.endTime})`).join(', '));

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await localDb.$disconnect();
    await renderDb.$disconnect();
  }
}

compareData();
