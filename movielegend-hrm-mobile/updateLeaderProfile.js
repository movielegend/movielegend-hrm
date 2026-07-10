const fs = require('fs');
let content = fs.readFileSync('src/features/employees/LeaderProfileScreen.tsx', 'utf8');

content = content.replace('export function AdminProfileScreen', 'export function LeaderProfileScreen');
content = content.replace('Qu?n tr? viên', 'Tru?ng phòng');
content = content.replace('System Admin', 'Leader');
content = content.replace('Qu?n tr? Nhân s?', 'Qu?n lý Nhân s?');
content = content.replace('<GridCard title="Co c?u T? ch?c" icon="domain" iconBg="#F3E8FF" iconColor="#A855F7" onPress={() => router.push(\'/admin/branches\')} />', '<GridCard title="Nhân s? phòng" icon="account-tie" iconBg="#F3E8FF" iconColor="#A855F7" onPress={() => router.push(\'/leader/employees\')} />');

content = content.replace(/router\.push\(\'\/admin\//g, 'router.push(\'/leader/');

const khoBaiStart = content.indexOf('{/* Nhóm 4: Qu?n lý Kho */}');
const khoBaiEnd = content.indexOf('{/* Action Section */}');

if (khoBaiStart !== -1 && khoBaiEnd !== -1) {
    content = content.substring(0, khoBaiStart) + content.substring(khoBaiEnd);
}

fs.writeFileSync('src/features/employees/LeaderProfileScreen.tsx', content);
