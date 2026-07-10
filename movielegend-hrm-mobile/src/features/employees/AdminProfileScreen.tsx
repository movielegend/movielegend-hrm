import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Background Header */}
        <View style={styles.headerBg} />
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Quản trị viên'}</Text>
          <Text style={styles.userRole}>System Admin</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang hoạt động</Text>
          </View>
        </View>

        {/* CÁC CHỨC NĂNG QUẢN TRỊ */}

        {/* Nhóm 1: Quản trị Nhân sự */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản trị Nhân sự</Text>
          <View style={styles.grid}>
            <GridCard title="Cơ cấu Tổ chức" icon="domain" iconBg="#F3E8FF" iconColor="#A855F7" onPress={() => router.push('/admin/branches')} />
          </View>
        </View>

        {/* Nhóm 2: Chấm công & Lịch làm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chấm công & Ca làm</Text>
          <View style={styles.grid}>
            <GridCard title="Dữ liệu Chấm công" icon="clock-check-outline" iconBg="#D1FAE5" iconColor="#10B981" onPress={() => router.push('/admin/attendance')} />
            <GridCard title="Ca làm việc" icon="calendar-clock" iconBg="#E0E7FF" iconColor="#6366F1" onPress={() => router.push('/admin/shifts')} />
            <GridCard title="Duyệt đơn" icon="clipboard-check-outline" iconBg="#FFE4E6" iconColor="#F43F5E" onPress={() => router.push('/admin/approvals')} />
            <GridCard title="Luân chuyển PB" icon="swap-horizontal" iconBg="#E2E8F0" iconColor="#64748B" onPress={() => router.push('/admin/cross-department')} />
          </View>
        </View>

        {/* Nhóm Nội bộ & Truyền thông */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nội bộ & Truyền thông</Text>
          <View style={styles.grid}>
            <GridCard title="Bảng tin" icon="newspaper-variant" iconBg="#CCFBF1" iconColor="#14B8A6" onPress={() => router.push('/admin/newsfeed')} />
            <GridCard title="Nhóm Chat" icon="chat" iconBg="#CFFAFE" iconColor="#06B6D4" onPress={() => router.push('/admin/chat')} />
            <GridCard title="Hợp đồng" icon="file-document-edit" iconBg="#FEF3C7" iconColor="#D97706" onPress={() => router.push('/admin/contracts')} />
          </View>
        </View>

        {/* Nhóm 3: Công việc & Tài sản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công việc & Tài sản</Text>
          <View style={styles.grid}>
            <GridCard title="Công việc" icon="briefcase-check-outline" iconBg="#CFFAFE" iconColor="#06B6D4" onPress={() => router.push('/admin/tasks')} />

            <GridCard title="Sự cố" icon="alert-octagon-outline" iconBg="#FEE2E2" iconColor="#EF4444" onPress={() => router.push('/admin/asset-incidents')} />
            <GridCard title="Tài sản" icon="devices" iconBg="#E0E7FF" iconColor="#6366F1" onPress={() => router.push('/admin/assets')} />
            <GridCard title="Vật tư" icon="cube-outline" iconBg="#D1FAE5" iconColor="#10B981" onPress={() => router.push('/admin/materials')} />
          </View>
        </View>

        {/* Action Section */}
        <View style={[styles.section, { marginTop: spacing.xl }]}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          
          <Pressable style={styles.actionRow} onPress={handleLogout}>
            <View style={[styles.actionIconBg, { backgroundColor: colors.dangerSoft }]}>
              <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.danger }]}>Đăng xuất</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.danger} />
          </Pressable>
        </View>

        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

function GridCard({ title, icon, iconBg, iconColor, onPress }: any) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.cardIconBg, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerBg: {
    backgroundColor: colors.primary,
    height: 160,
    width: '100%',
    position: 'absolute',
    top: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileCard: {
    backgroundColor: '#fff',
    marginTop: 80,
    marginHorizontal: spacing.lg,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -50,
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  cardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  versionText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.xl,
    fontSize: 13,
  }
});
