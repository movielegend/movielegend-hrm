import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function EmployeeProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
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
          <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.userRole}>{user?.position?.name || 'Nhân viên'}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang hoạt động</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <InfoRow 
            icon="identifier" 
            label="Mã nhân viên" 
            value={user?.userCode || 'Chưa cập nhật'} 
          />
          <InfoRow 
            icon="phone-outline" 
            label="Số điện thoại" 
            value={user?.phone || 'Chưa cập nhật'} 
          />
          <InfoRow 
            icon="email-outline" 
            label="Email" 
            value={user?.email || 'Chưa cập nhật'} 
          />
          <InfoRow 
            icon="office-building-outline" 
            label="Phòng ban" 
            value={user?.department?.name || 'Chưa cập nhật'} 
          />
          <InfoRow 
            icon="face-recognition" 
            label="Dữ liệu khuôn mặt" 
            value={user?.hasFaceData ? 'Đã thiết lập' : 'Chưa thiết lập'} 
            valueColor={user?.hasFaceData ? colors.success : colors.danger}
          />
        </View>

        {/* Action Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng</Text>
          <Pressable style={styles.actionRow} onPress={() => router.push('/employee/contracts' as any)}>
            <View style={[styles.actionIconBg, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="text-box-check-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Hợp đồng lao động</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          <Pressable style={styles.actionRow} onPress={() => router.push('/employee/payroll' as any)}>
            <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color="#DC2626" />
            </View>
            <Text style={styles.actionLabel}>Phiếu lương</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
          
          <Pressable style={styles.actionRow} onPress={() => router.push('/employee/assets' as any)}>
            <View style={[styles.actionIconBg, { backgroundColor: '#EDE9FE' }]}>
              <MaterialCommunityIcons name="laptop" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.actionLabel}>Tài sản của tôi</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          <Pressable style={styles.actionRow} onPress={() => router.push('/employee/news' as any)}>
            <View style={[styles.actionIconBg, { backgroundColor: '#CCFBF1' }]}>
              <MaterialCommunityIcons name="newspaper-variant" size={20} color="#14B8A6" />
            </View>
            <Text style={styles.actionLabel}>Bảng tin nội bộ</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
        </View>

        {/* Setting Section */}
        <View style={styles.section}>
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

function InfoRow({ icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBg}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
      </View>
    </View>
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
    marginTop: -50, // Float above card
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
    backgroundColor: '#F0FDF4', // Emerald 50
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
  infoRow: {
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
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
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
