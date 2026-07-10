const fs = require('fs');
let code = fs.readFileSync('src/features/shifts/AssignShiftScreen.tsx', 'utf8');

code = code.replace(/user\?\.role === 'ADMIN'/g, "user?.roles?.includes('ADMIN')");

fs.writeFileSync('src/features/shifts/AssignShiftScreen.tsx', code);
