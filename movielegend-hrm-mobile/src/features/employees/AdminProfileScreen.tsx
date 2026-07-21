import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
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
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Background Header */}
        <View style={[styles.headerBg, { height: 160 + insets.top }]} />
        
        {/* Profile Card */}
        <View style={[styles.profileCard, { marginTop: 80 + insets.top }]}>
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

        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="identifier" label="Mã nhân viên" value={user?.userCode || 'Chưa cập nhật'} />
            <InfoRow icon="phone-outline" label="Số điện thoại" value={user?.phone || 'Chưa cập nhật'} />
            <InfoRow icon="email-outline" label="Email" value={user?.email || 'Chưa cập nhật'} />
            <InfoRow icon="office-building-outline" label="Phòng ban" value={user?.department?.name || 'Quản trị hệ thống'} isLast />
          </View>
        </View>

        {/* Tính năng Nhân sự */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng Nhân sự</Text>
          <View style={styles.infoCard}>
            <ActionRow icon="domain" title="Cơ cấu Tổ chức" onPress={() => router.push('/admin/branches')} />
            <ActionRow icon="clock-check-outline" title="Dữ liệu Chấm công" onPress={() => router.push('/admin/attendance')} />
            <ActionRow icon="calendar-clock" title="Ca làm việc" onPress={() => router.push('/admin/shifts')} />
            <ActionRow icon="clipboard-check-outline" title="Duyệt đơn" onPress={() => router.push('/leader/employee-requests')} />
            <ActionRow icon="account-check-outline" title="Duyệt tài khoản" onPress={() => router.push('/admin/approvals')} />
            <ActionRow icon="swap-horizontal" title="Luân chuyển PB" onPress={() => router.push('/admin/cross-department')} />
            <ActionRow icon="file-document-edit" title="Hợp đồng" onPress={() => router.push('/admin/contracts')} />
            <ActionRow icon="message-draw" title="Quản lý Góp ý" onPress={() => router.push('/admin/feedbacks' as any)} isLast />
          </View>
        </View>

        {/* Tính năng Vận hành */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng Vận hành</Text>
          <View style={styles.infoCard}>
            <ActionRow icon="newspaper-variant" title="Bảng tin" onPress={() => router.push('/admin/newsfeed')} />
            <ActionRow icon="chat" title="Nhóm Chat" onPress={() => router.push('/admin/chat')} />
            <ActionRow icon="briefcase-check-outline" title="Công việc" onPress={() => router.push('/admin/tasks')} />
            <ActionRow icon="alert-octagon-outline" title="Sự cố" onPress={() => router.push('/admin/asset-incidents')} />
            <ActionRow icon="cube-outline" title="Vật tư" onPress={() => router.push('/admin/materials')} isLast />
          </View>
        </View>

        {/* Cài đặt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          <View style={styles.infoCard}>
            <ActionRow icon="lock-outline" title="Đổi mật khẩu" onPress={() => {}} />
            <Pressable style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <View style={[styles.actionIconBg, { backgroundColor: colors.dangerSoft }]}>
                <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.danger }]}>Đăng xuất</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.danger} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?"
        confirmLabel="Đăng xuất"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          void logout();
        }}
      />
    </View>
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
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerBg: {
    backgroundColor: '#111827',
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
