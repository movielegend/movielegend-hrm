import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { useRouter } from 'expo-router';

type ColorTheme = 'green' | 'orange' | 'purple' | 'gray' | 'teal' | 'cyan' | 'pink' | 'red';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  colorTheme: ColorTheme;
  onPress: () => void;
  isLast?: boolean;
}

const themeColors: Record<ColorTheme, { bg: string; icon: string }> = {
  green: { bg: '#EAF7F0', icon: '#10B981' },
  orange: { bg: '#FFF3E0', icon: '#F59E0B' },
  purple: { bg: '#EEF2FF', icon: '#6366F1' },
  gray: { bg: '#F3F4F6', icon: '#6B7280' },
  teal: { bg: '#E6FFFA', icon: '#14B8A6' },
  cyan: { bg: '#E0F2FE', icon: '#0EA5E9' },
  pink: { bg: '#FCE7F3', icon: '#EC4899' },
  red: { bg: '#FEE2E2', icon: '#EF4444' },
};

function MenuItem({ icon, title, subtitle, colorTheme, onPress, isLast }: MenuItemProps) {
  const colors = themeColors[colorTheme];

  return (
    <>
      <Pressable style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]} onPress={onPress}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.bg }]}>
          <Ionicons name={icon} size={20} color={colors.icon} />
        </View>
        <View style={styles.menuItemTextContainer}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </Pressable>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateTo = (path: any) => {
    router.push(path);
  };

  const handleNotImplemented = () => {
    Alert.alert('Thông báo', 'Tính năng đang được phát triển.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* NGHIỆP VỤ */}
        <Text style={styles.sectionTitle}>NGHIỆP VỤ</Text>
        <View style={styles.card}>
          <MenuItem 
            icon="time-outline" title="Lịch sử chấm công" colorTheme="green" 
            onPress={handleNotImplemented} 
          />
          <MenuItem 
            icon="calendar-outline" title="Lịch ca làm việc" colorTheme="orange" 
            onPress={handleNotImplemented} 
          />
          <MenuItem 
            icon="wallet-outline" title="Phiếu lương" colorTheme="green" 
            onPress={() => navigateTo('/admin/payslip')} isLast 
          />
        </View>

        {/* TÀI KHOẢN & BẢO MẬT */}
        <Text style={styles.sectionTitle}>TÀI KHOẢN & BẢO MẬT</Text>
        <View style={styles.card}>
          <MenuItem 
            icon="scan-outline" title="Đăng ký khuôn mặt" subtitle="Chụp 3 góc để tăng độ chính xác chấm công" colorTheme="purple" 
            onPress={handleNotImplemented} 
          />
          <MenuItem 
            icon="lock-closed-outline" title="Đổi mật khẩu" colorTheme="gray" 
            onPress={() => navigateTo('/admin/change-password')} 
          />
          <MenuItem 
            icon="notifications-outline" title="Thông báo" colorTheme="orange" 
            onPress={() => navigateTo('/admin/notifications')} isLast 
          />
        </View>

        {/* QUẢN TRỊ HỆ THỐNG */}
        <Text style={styles.sectionTitle}>QUẢN TRỊ HỆ THỐNG</Text>
        <View style={styles.card}>
          <MenuItem icon="people-outline" title="Nhân viên" colorTheme="purple" onPress={() => navigateTo('/admin/employees')} />
          <MenuItem icon="business-outline" title="Phòng ban" colorTheme="teal" onPress={() => navigateTo('/admin/departments')} />
          <MenuItem icon="calendar-outline" title="Ca làm / Xếp ca" colorTheme="cyan" onPress={handleNotImplemented} />
          <MenuItem icon="time-outline" title="Quản lý chấm công" colorTheme="green" onPress={handleNotImplemented} />
          <MenuItem icon="checkmark-circle-outline" title="Duyệt chấm công" colorTheme="teal" onPress={handleNotImplemented} />
          <MenuItem icon="wallet-outline" title="Payroll" colorTheme="green" onPress={() => navigateTo('/admin/payslip')} />
          <MenuItem icon="cube-outline" title="Kho CCHT" colorTheme="pink" onPress={handleNotImplemented} />
          <MenuItem icon="warning-outline" title="Báo cáo thiết bị" colorTheme="orange" onPress={handleNotImplemented} />
          <MenuItem icon="person-add-outline" title="Duyệt đăng ký" colorTheme="cyan" onPress={handleNotImplemented} />
          <MenuItem icon="notifications-outline" title="Thông báo hệ thống" colorTheme="red" onPress={handleNotImplemented} isLast />
        </View>

        {/* ĐIỀU HÀNH */}
        <Text style={styles.sectionTitle}>ĐIỀU HÀNH</Text>
        <View style={styles.card}>
          <MenuItem icon="disc-outline" title="Mục tiêu chấm công" colorTheme="orange" onPress={handleNotImplemented} />
          <MenuItem icon="location-outline" title="Bản đồ giám sát" colorTheme="teal" onPress={() => navigateTo('/admin/attendance-locations')} />
          <MenuItem icon="briefcase-outline" title="Tạo công việc" colorTheme="teal" onPress={() => navigateTo('/admin/tasks/create')} />
          <MenuItem icon="grid-outline" title="Dashboard công việc" colorTheme="purple" onPress={handleNotImplemented} />
          <MenuItem icon="document-text-outline" title="Templates" colorTheme="purple" onPress={handleNotImplemented} />
          <MenuItem icon="bar-chart-outline" title="Báo cáo KPI" colorTheme="purple" onPress={handleNotImplemented} />
          <MenuItem icon="swap-horizontal-outline" title="Yêu cầu liên phòng" colorTheme="orange" onPress={handleNotImplemented} isLast />
        </View>

        {/* ĐĂNG XUẤT */}
        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]} onPress={handleLogout}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2', borderRadius: 8 }]}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // Tăng khoảng trống ở dưới cùng
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  menuItemPressed: {
    backgroundColor: '#F9FAFB',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 72,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  logoutButtonPressed: {
    backgroundColor: '#F9FAFB',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 24,
  },
});
