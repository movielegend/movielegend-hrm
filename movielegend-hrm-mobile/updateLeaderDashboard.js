const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/LeaderDashboard.tsx', 'utf8');

const newGrid = 
          <GridCard 
            title="Duy?t tài kho?n" 
            icon="check-decagram-outline" 
            iconBg="#FEF3C7" // Yellow
            iconColor="#F59E0B"
            onPress={() => router.push('/leader/approvals')}
          />
          <GridCard 
            title="Ch?m công" 
            icon="swap-horizontal" 
            iconBg="#E0F2FE" // Blue
            iconColor="#3B82F6"
            onPress={() => router.push('/leader/attendance')}
          />
          <GridCard 
            title="Ngh? phép" 
            icon="calendar-remove" 
            iconBg="#FEE2E2" // Red
            iconColor="#EF4444"
            onPress={() => router.push('/leader/leave-approvals')}
          />
          <GridCard 
            title="Tang ca" 
            icon="clock-fast" 
            iconBg="#FFEDD5" // Orange
            iconColor="#F97316"
            onPress={() => router.push('/leader/overtime-approvals')}
          />
          <GridCard 
            title="Phân ca" 
            icon="view-grid" 
            iconBg="#E0E7FF" // Indigo
            iconColor="#6366F1"
            onPress={() => router.push('/leader/shift-management')}
          />
          <GridCard 
            title="Nhân s? phòng" 
            icon="account-tie" 
            iconBg="#D1FAE5" // Green
            iconColor="#10B981"
            onPress={() => router.push('/leader/employees')}
          />
          <GridCard 
            title="Công vi?c" 
            icon="check-circle-outline" 
            iconBg="#F3E8FF" // Purple
            iconColor="#A855F7"
            onPress={() => router.push('/leader/tasks')}
          />
          <GridCard 
            title="Nhóm vi?c" 
            icon="account-group" 
            iconBg="#E0E7FF" // Indigo
            iconColor="#6366F1"
            onPress={() => router.push('/leader/task-groups')}
          />
          <GridCard 
            title="S? c? tài s?n" 
            icon="alert-circle-outline" 
            iconBg="#FFE4E6" // Rose
            iconColor="#F43F5E"
            onPress={() => router.push('/leader/asset-incidents')}
          />
          <GridCard 
            title="Yêu c?u VTTB" 
            icon="box-variant" 
            iconBg="#FCE7F3" // Pink
            iconColor="#DB2777"
            onPress={() => router.push('/leader/material-issues')}
          />
          <GridCard 
            title="Liên phòng ban" 
            icon="transit-connection-variant" 
            iconBg="#FEF9C3" // Yellow
            iconColor="#EAB308"
            onPress={() => router.push('/leader/cross-department')}
          />
;

// The Grid is inside <View style={styles.grid}>
const startMarker = '<View style={styles.grid}>';
const endMarker = '</View>\n      </ScrollView>';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex + startMarker.length) + '\n' + newGrid + '        ' + content.substring(endIndex);
  fs.writeFileSync('src/features/dashboard/LeaderDashboard.tsx', content);
}
