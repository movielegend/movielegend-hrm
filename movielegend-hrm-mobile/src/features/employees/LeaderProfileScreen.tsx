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
          <Text style={styles.userName}>{user?.fullName || 'Trưởng phòng'}</Text>
          <Text style={styles.userRole}>Leader</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang hoạt động</Text>
          </View>
        </View>

        {/* NHÓM CÁC CHỨC NĂNG DÀNH CHO LEADER */}

        {/* Nhóm 1: Quản lý Nhân sự */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý Nhân sự</Text>
          <View style={styles.grid}>
            <GridCard title="Nhân sự phòng" icon="account-tie" iconBg="#D1FAE5" iconColor="#10B981" onPress={() => router.push('/leader/employees')} />
            <GridCard title="Duyệt tài khoản" icon="check-decagram-outline" iconBg="#FEF3C7" iconColor="#F59E0B" onPress={() => router.push('/leader/approvals')} />
          </View>
        </View>

        {/* Nhóm 2: Chấm công & Ca làm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chấm công & Nghỉ phép</Text>
          <View style={styles.grid}>
            <GridCard title="Chấm công" icon="clock-check-outline" iconBg="#E0F2FE" iconColor="#3B82F6" onPress={() => router.push('/leader/attendance')} />
            <GridCard title="Phân ca" icon="view-grid" iconBg="#E0E7FF" iconColor="#6366F1" onPress={() => router.push('/leader/shift-management')} />
            <GridCard title="Nghỉ phép" icon="calendar-remove" iconBg="#FEE2E2" iconColor="#EF4444" onPress={() => router.push('/leader/leave-approvals')} />
            <GridCard title="Tăng ca" icon="clock-fast" iconBg="#FFEDD5" iconColor="#F97316" onPress={() => router.push('/leader/overtime-approvals')} />
          </View>
        </View>

        {/* Nhóm 3: Công việc */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công việc & Liên kết</Text>
          <View style={styles.grid}>
            <GridCard title="Công việc" icon="briefcase-check-outline" iconBg="#F3E8FF" iconColor="#A855F7" onPress={() => router.push('/leader/tasks')} />

            <GridCard title="Liên phòng ban" icon="transit-connection-variant" iconBg="#FEF9C3" iconColor="#EAB308" onPress={() => router.push('/leader/cross-department')} />
          </View>
        </View>

        {/* Nhóm 4: Tài sản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài sản & VTTB</Text>
          <View style={styles.grid}>
            <GridCard title="Sự cố tài sản" icon="alert-circle-outline" iconBg="#FFE4E6" iconColor="#F43F5E" onPress={() => router.push('/leader/asset-incidents')} />
            <GridCard title="Yêu cầu VTTB" icon="box-variant" iconBg="#FCE7F3" iconColor="#DB2777" onPress={() => router.push('/leader/material-issues')} />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileCard: {
    margin: spacing.lg,
    marginTop: 60,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.sm,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  },
  versionText: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xl,
  },
});
