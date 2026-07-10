const fs = require('fs');
let code = fs.readFileSync('src/features/shifts/AssignShiftScreen.tsx', 'utf8');

code = code.split("user?.roles?.some(r => r.code === 'ADMIN')").join("user?.roles?.includes('ADMIN')");

fs.writeFileSync('src/features/shifts/AssignShiftScreen.tsx', code);
