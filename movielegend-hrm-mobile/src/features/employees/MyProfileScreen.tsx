import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../providers/AuthProvider';
import { useOnboarding } from '../../components/Onboarding/OnboardingProvider';
import type { DashboardRole } from '../../api/dashboard.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function MyProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showOnboarding } = useOnboarding();

  const handleReplayOnboarding = () => {
    let role: DashboardRole = 'EMPLOYEE';
    if (user?.roles?.includes('ADMIN')) role = 'ADMIN';
    else if (user?.roles?.includes('LEADER')) role = 'LEADER';
    
    showOnboarding(role);
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
      <PageHeader title="Hồ sơ cá nhân" subtitle="Thông tin tài khoản của bạn" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Background Header - to flow from PageHeader */}
        <View style={styles.headerBg} />

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.userRole}>{user?.position?.name || 'Nhân viên'}</Text>
          <Text style={styles.userDepartment}>{user?.department?.name || ''}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang hoạt động</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ & Công việc</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="identifier" label="Mã nhân viên" value={user?.userCode || 'Chưa cập nhật'} />
            <InfoRow icon="phone-outline" label="Số điện thoại" value={user?.phone || 'Chưa cập nhật'} />
            <InfoRow icon="email-outline" label="Email" value={user?.email || 'Chưa cập nhật'} />
            <InfoRow icon="office-building-outline" label="Phòng ban" value={user?.department?.name || 'Chưa cập nhật'} />
            <InfoRow 
              icon="face-recognition" 
              label="Dữ liệu khuôn mặt" 
              value={user?.hasFaceData ? 'Đã thiết lập' : 'Chưa thiết lập'} 
              valueColor={user?.hasFaceData ? '#10B981' : '#EF4444'}
              onPress={() => router.push('/employee/update-face' as any)}
            />
            <InfoRow 
              icon="information-outline" 
              label="Hướng dẫn sử dụng" 
              value="Xem lại" 
              onPress={handleReplayOnboarding}
              isLast
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ icon, label, value, valueColor, onPress, isLast }: any) {
  const Container = onPress ? Pressable : View;
  return (
    <Container style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
      <View style={styles.infoIconBg}>
        <MaterialCommunityIcons name={icon} size={20} color="#111827" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
      </View>
      {onPress && <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />}
    </Container>
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
    height: 100,
    width: '100%',
    position: 'absolute',
    top: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileCard: {
    backgroundColor: '#fff',
    marginTop: 30,
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
});
