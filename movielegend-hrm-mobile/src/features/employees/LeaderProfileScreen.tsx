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

        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="identifier" label="Mã nhân viên" value={user?.userCode || 'Chưa cập nhật'} />
            <InfoRow icon="phone-outline" label="Số điện thoại" value={user?.phone || 'Chưa cập nhật'} />
            <InfoRow icon="email-outline" label="Email" value={user?.email || 'Chưa cập nhật'} />
            <InfoRow icon="office-building-outline" label="Phòng ban" value={user?.department?.name || 'Chưa cập nhật'} isLast />
          </View>
        </View>

        {/* Quản lý Phòng ban */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý Phòng ban</Text>
          <View style={styles.infoCard}>
            <ActionRow icon="clipboard-check-outline" title="Duyệt đơn từ" onPress={() => router.push('/leader/employee-requests' as any)} />
            <ActionRow icon="account-check-outline" title="Duyệt tài khoản" onPress={() => router.push('/leader/approvals/account' as any)} />
            <ActionRow icon="swap-horizontal" title="Luân chuyển PB" onPress={() => router.push('/leader/cross-department' as any)} />
            <ActionRow icon="help-circle-outline" title="Yêu cầu VTTB" onPress={() => router.push('/leader/material-issues' as any)} />
            <ActionRow icon="account-multiple" title="Nhân sự phòng" onPress={() => router.push('/leader/employees' as any)} />
            <ActionRow icon="calendar-check" title="Phân ca làm" onPress={() => router.push('/leader/shift-management' as any)} />
            <ActionRow icon="newspaper-variant-outline" title="Bảng tin" onPress={() => router.push('/leader/newsfeed' as any)} />
            <ActionRow icon="chat" title="Nhóm Chat" onPress={() => router.push('/leader/chat' as any)} isLast />
          </View>
        </View>

        {/* Tiện ích cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích cá nhân</Text>
          <View style={styles.infoCard}>
            <ActionRow icon="card-account-details-outline" title="Hồ sơ của tôi" onPress={() => router.push('/leader/my-profile' as any)} />
            <ActionRow icon="cash-multiple" title="Bảng lương" onPress={() => router.push('/leader/payslip' as any)} isLast />
          </View>
        </View>

        {/* Cài đặt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          <View style={styles.infoCard}>
            <ActionRow icon="lock-outline" title="Đổi mật khẩu" onPress={() => {}} />
            <Pressable style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
              </View>
              <Text style={[styles.actionLabel, { color: '#DC2626' }]}>Đăng xuất</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#DC2626" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ icon, label, value, isLast }: any) {
  return (
    <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIconBg}>
        <MaterialCommunityIcons name={icon} size={20} color="#111827" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, title, onPress, isLast }: any) {
  return (
    <Pressable style={[styles.actionRow, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
      <View style={styles.actionIconBg}>
        <MaterialCommunityIcons name={icon} size={20} color="#111827" />
      </View>
      <Text style={styles.actionLabel}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
    backgroundColor: '#FAFAFA',
    minHeight: '100%',
  },
  headerBg: {
    backgroundColor: '#111827',
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
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
  },
  statusText: {
    color: '#4B5563',
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
    color: '#111827',
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  versionText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: spacing.xl,
    fontSize: 13,
  }
});
