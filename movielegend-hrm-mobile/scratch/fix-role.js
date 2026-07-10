const fs = require('fs');
let code = fs.readFileSync('src/features/shifts/AssignShiftScreen.tsx', 'utf8');

code = code.split("user?.role === 'ADMIN'").join("user?.roles?.some(r => r.code === 'ADMIN')");

fs.writeFileSync('src/features/shifts/AssignShiftScreen.tsx', code);
