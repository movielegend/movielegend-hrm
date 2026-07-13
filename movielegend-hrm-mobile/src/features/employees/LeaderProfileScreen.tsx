import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function LeaderProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'L';
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
          <Text style={styles.userName}>{user?.fullName || 'Quản lý'}</Text>
          <Text style={styles.userRole}>{user?.position?.name || 'Trưởng phòng / Quản lý'}</Text>
          <Text style={styles.userDepartment}>{user?.department?.name || ''}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang hoạt động</Text>
          </View>
        </View>

        {/* Nhóm 1: Quản lý Phòng ban */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý Phòng ban</Text>
          <View style={styles.grid}>
            <GridCard title="Nhân sự phòng" icon="account-group-outline" iconBg="#F3E8FF" iconColor="#A855F7" onPress={() => router.push('/leader/employees' as any)} />
            <GridCard title="Phân ca làm" icon="calendar-account-outline" iconBg="#E0E7FF" iconColor="#6366F1" onPress={() => router.push('/leader/shift-management' as any)} />
          </View>
        </View>

        {/* Nhóm 2: Nội bộ & Truyền thông */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nội bộ & Truyền thông</Text>
          <View style={styles.grid}>
            <GridCard title="Bảng tin" icon="newspaper-variant" iconBg="#CCFBF1" iconColor="#14B8A6" onPress={() => router.push('/leader/newsfeed' as any)} />
            <GridCard title="Nhóm Chat" icon="chat" iconBg="#CFFAFE" iconColor="#06B6D4" onPress={() => router.push('/leader/chat' as any)} />
          </View>
        </View>

        {/* Nhóm 3: Cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích cá nhân</Text>
          <View style={styles.grid}>
            <GridCard title="Hồ sơ của tôi" icon="card-account-details-outline" iconBg="#CCFBF1" iconColor="#14B8A6" onPress={() => router.push('/leader/my-profile' as any)} />
            <GridCard title="Bảng lương" icon="cash-multiple" iconBg="#CFFAFE" iconColor="#06B6D4" onPress={() => router.push('/leader/payslip' as any)} />
            <GridCard title="Lịch cá nhân" icon="calendar-month-outline" iconBg="#FEF3C7" iconColor="#D97706" onPress={() => router.push('/leader/schedule' as any)} />
            <GridCard title="Hợp đồng" icon="file-document-outline" iconBg="#E2E8F0" iconColor="#64748B" onPress={() => router.push('/leader/contracts' as any)} />
          </View>
        </View>

        {/* Action Section */}
        <View style={[styles.section, { marginTop: spacing.xl }]}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          
          <Pressable style={styles.actionRow} onPress={() => {}}>
            <View style={[styles.actionIconBg, { backgroundColor: '#F1F5F9' }]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.text} />
            </View>
            <Text style={styles.actionLabel}>Đổi mật khẩu</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

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
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 13,
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
