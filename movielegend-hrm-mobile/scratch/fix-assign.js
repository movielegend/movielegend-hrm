const fs = require('fs');
let code = fs.readFileSync('src/features/shifts/AssignShiftScreen.tsx', 'utf8');

// subtitle text
code = code.replace(/subtitle: "Ch\uFFFD\?n nhAn viAn vA ca lAm vic t\uFFFDng \uFFFDcng"/, "subtitle={user?.role === 'ADMIN' ? 'Chọn Leader và ca làm việc' : 'Chọn nhân viên và ca làm việc'}");

// Employee label
code = code.replace(/<Text style=\{styles.label\}>NhAn s<\/Text>/, "<Text style={styles.label}>{user?.role === 'ADMIN' ? 'Leader' : 'Nhân sự'}</Text>");

// Placeholder 
code = code.replace(/\{selectedEmployee \? selectedEmployee.label : 'Ch\uFFFD\?n nhAn viAn\.\.\.'\}/, "{selectedEmployee ? selectedEmployee.label : user?.role === 'ADMIN' ? 'Chọn Leader...' : 'Chọn nhân viên...'}");

// Modal title
code = code.replace(/title="Ch\uFFFD\?n nhAn viAn"/, "title={user?.role === 'ADMIN' ? 'Chọn Leader' : 'Chọn nhân viên'}");

fs.writeFileSync('src/features/shifts/AssignShiftScreen.tsx', code);
console.log('done UI');
