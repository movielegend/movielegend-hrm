import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { useUserGuide } from '../../components/UserGuideManager';
import { ConfirmModal } from '../../components/ConfirmModal';

export function HRProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { showGuideManual } = useUserGuide();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ').filter(Boolean);
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
          <Text style={styles.userName}>{user?.fullName || 'Chuyên viên HR'}</Text>
          <Text style={styles.userRole}>Quản trị Nhân sự (HR)</Text>
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
            <InfoRow icon="office-building-outline" label="Phòng ban" value={user?.department?.name || 'Phòng Hành chính Nhân sự'} />
            <InfoRow 
              icon="face-recognition" 
              label="Dữ liệu khuôn mặt" 
              value={user?.hasFaceData ? 'Đã thiết lập' : 'Chưa thiết lập'} 
              valueColor={user?.hasFaceData ? '#10B981' : '#EF4444'}
              onPress={() => router.push('/employee/update-face' as any)}
              isLast
            />
          </View>
        </View>

        {/* Nghiệp vụ HR & Quản trị */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nghiệp vụ Quản trị HR</Text>
          <View style={styles.infoCard}>
            <ActionRow 
              icon="clock-check-outline" 
              title="Bảng chấm công toàn cty" 
              onPress={() => router.push('/hr/attendance-management' as any)} 
            />
            <ActionRow 
              icon="clipboard-check-outline" 
              title="Duyệt đơn từ & Phê duyệt" 
              onPress={() => router.push('/hr/requests' as any)} 
            />
            <ActionRow 
              icon="clipboard-text-outline" 
              title="Quản lý công việc" 
              onPress={() => router.push('/hr/(tabs)/tasks' as any)} 
            />
            <ActionRow 
              icon="text-box-check-outline" 
              title="Quản lý Hợp đồng lao động" 
              onPress={() => router.push('/hr/contracts' as any)} 
            />
            <ActionRow 
              icon="laptop" 
              title="Vật tư & Cấp phát thiết bị" 
              onPress={() => router.push('/hr/assets' as any)} 
            />
            <ActionRow 
              icon="chat-processing-outline" 
              title="Tin nhắn & Nhóm chat" 
              onPress={() => router.push('/hr/chat' as any)} 
            />
            <ActionRow 
              icon="message-draw" 
              title="Hòm thư Góp ý nhân viên" 
              onPress={() => router.push('/hr/feedbacks' as any)} 
            />
            <ActionRow 
              icon="newspaper-variant" 
              title="Bảng tin & Thông báo công ty" 
              onPress={() => router.push('/hr/(tabs)/newsfeed' as any)} 
              isLast 
            />
          </View>
        </View>

        {/* Cài đặt & Tài khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt & Tài khoản</Text>
          <View style={styles.infoCard}>
            <ActionRow 
              icon="information-outline" 
              title="Hướng dẫn sử dụng" 
              onPress={showGuideManual} 
            />
            <ActionRow 
              icon="lock-reset" 
              title="Đổi mật khẩu" 
              onPress={() => Alert.alert('Thông báo', 'Tính năng đổi mật khẩu đang được cập nhật.')} 
            />
            <ActionRow 
              icon="logout-variant" 
              title="Đăng xuất" 
              titleColor="#EF4444"
              iconColor="#EF4444"
              onPress={() => setShowLogoutConfirm(true)} 
              isLast 
            />
          </View>
        </View>

        <Text style={styles.versionText}>Phiên bản 1.0.0 (HR Suite)</Text>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản HR không?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="danger"
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor, onPress, isLast }: any) {
  const Component = onPress ? Pressable : View;
  return (
    <Component 
      style={[styles.rowContainer, isLast && styles.noBorder]} 
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name={icon} size={20} color="#4B5563" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
        {onPress && <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />}
      </View>
    </Component>
  );
}

function ActionRow({ icon, title, titleColor, iconColor, onPress, isLast }: any) {
  return (
    <Pressable 
      style={[styles.rowContainer, isLast && styles.noBorder]} 
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrapper, iconColor && { backgroundColor: iconColor + '15' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={iconColor || '#111827'} />
        </View>
        <Text style={[styles.actionTitle, titleColor && { color: titleColor }]}>{title}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 10,
    marginBottom: 20,
  },
});
