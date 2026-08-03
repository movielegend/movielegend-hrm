// Quick verify: logic tẩy trắng theo mức đúng chưa
const SHIFT_DURATION_MIN = 20;

function calcPenalty(lateMin, hasApprovedLeave) {
  if (lateMin <= 0) return { level: null, amount: null, workDays: null };
  const ratio = lateMin / SHIFT_DURATION_MIN;
  let level, amount, workDays;
  if (ratio <= 0.105)      { level = 1; amount = 50000; workDays = 1; }
  else if (ratio <= 0.42)  { level = 2; amount = 80000; workDays = 1; }
  else if (ratio <= 0.63)  { level = 3; amount = 50000; workDays = 0.5; }
  else                      { level = 4; amount = 0;     workDays = 0; }

  if (hasApprovedLeave && level !== null) {
    if (level <= 3) {
      // Mức 1/2/3 → tẩy trắng
      return { level: null, amount: null, workDays: null, note: 'Tẩy trắng' };
    } else {
      // Mức 4 → giảm xuống Mức 3 (50k, 0.5 công)
      return { level: 3, amount: 50000, workDays: 0.5, note: 'Giảm Mức 4→3' };
    }
  }
  return { level, amount, workDays, note: 'Không đơn' };
}

const cases = [
  { lateMin: 2,  leave: false, label: 'Trễ 2p, không đơn' },
  { lateMin: 2,  leave: true,  label: 'Trễ 2p, có đơn APPROVED' },
  { lateMin: 5,  leave: false, label: 'Trễ 5p, không đơn' },
  { lateMin: 5,  leave: true,  label: 'Trễ 5p, có đơn APPROVED' },
  { lateMin: 10, leave: false, label: 'Trễ 10p, không đơn' },
  { lateMin: 10, leave: true,  label: 'Trễ 10p, có đơn APPROVED' },
  { lateMin: 15, leave: false, label: 'Trễ 15p, không đơn' },
  { lateMin: 15, leave: true,  label: 'Trễ 15p, có đơn APPROVED ← Mức 4' },
];

console.log('\n📋 Bảng logic penalty + đơn xin phép:\n');
console.log('  Kịch bản                          | Mức | Phạt     | Công | Ghi chú');
console.log('  ----------------------------------|-----|----------|------|--------');
for (const c of cases) {
  const r = calcPenalty(c.lateMin, c.leave);
  const muc = r.level ?? '-';
  const phat = r.amount != null ? r.amount.toLocaleString('vi-VN') + 'đ' : '0đ (xoá)';
  const cong = r.workDays != null ? r.workDays : 1;
  const pass = c.leave ? (
    c.lateMin <= 12 // mức 1-3
      ? (r.level === null ? '✅ Tẩy trắng' : '❌')
      : (r.level === 3 && r.workDays === 0.5 ? '✅ Mức 4→3' : '❌')
  ) : '—';
  console.log(`  ${c.label.padEnd(34)}| ${String(muc).padEnd(3)} | ${phat.padEnd(8)} | ${String(cong).padEnd(4)} | ${r.note} ${pass}`);
}
