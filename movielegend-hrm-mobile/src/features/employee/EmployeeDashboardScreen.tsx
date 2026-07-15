import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useMySchedule } from '../../hooks/useShifts';
import { useMyTasks } from '../../hooks/useTasks';
import { scheduleShiftNotifications, scheduleTaskNotifications } from '../../services/NotificationService';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
export function EmployeeDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: currentAttendance } = useCurrentAttendance();
  const { data: schedule } = useMySchedule();
  const { data: myTasks } = useMyTasks({ limit: 100 });

  useEffect(() => {
    if (schedule && schedule.length > 0) {
      scheduleShiftNotifications(schedule).catch(console.error);
    }
  }, [schedule]);

  useEffect(() => {
    if (myTasks && myTasks.items && myTasks.items.length > 0) {
      scheduleTaskNotifications(myTasks.items).catch(console.error);
    }
  }, [myTasks]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fullName = user?.fullName || user?.userCode || 'Nhân viên';
  const timeString = currentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateString = currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
          </View>
        </View>

        {/* Time Widget */}
        <View style={styles.timeWidget}>
          <Text style={styles.timeText}>{timeString}</Text>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>

        {/* Quick Check-in Button */}
        <Pressable
          style={[styles.checkInButton, currentAttendance?.state === 'CHECKED_IN' && { backgroundColor: '#F59E0B' }]}
          onPress={() => {
            if (currentAttendance?.state === 'CHECKED_IN') {
              router.push('/employee/attendance/check-out');
            } else {
              router.push('/employee/attendance/check-in');
            }
          }}
        >
          <MaterialCommunityIcons name="line-scan" size={32} color="#fff" />
          <Text style={styles.checkInText}>
            {currentAttendance?.state === 'CHECKED_IN' ? 'Kết thúc ca làm (Ra ca)' : 'Chấm công ngay (Vào ca)'}
          </Text>
        </Pressable>

        {/* Action Grid */}
        <Text style={styles.sectionTitle}>Tiện ích</Text>
        <View style={styles.grid}>
          <GridItem
            icon="calendar-clock"
            label="Ca làm việc"
            onPress={() => router.push('/employee/schedule')}
            color="#4F46E5"
          />
          <GridItem
            icon="format-list-checks"
            label="Công việc"
            onPress={() => router.push('/employee/tasks')}
            color="#059669"
            badge="2"
          />
          <GridItem
            icon="file-document-edit-outline"
            label="Đơn từ"
            onPress={() => router.push('/employee/requests')}
            color="#D97706"
          />
          <GridItem
            icon="cash-multiple"
            label="Lương thưởng"
            onPress={() => router.push('/employee/payroll')}
            color="#DC2626"
          />
          <GridItem
            icon="text-box-check-outline"
            label="Hợp đồng"
            onPress={() => router.push('/employee/contracts')}
            color="#2563EB"
          />
          <GridItem
            icon="laptop"
            label="Tài sản"
            onPress={() => router.push('/employee/assets')}
            color="#7C3AED"
          />
        </View>

      </ScrollView>
    </Screen>
  );
}

function GridItem({ icon, label, onPress, color, badge }: { icon: keyof typeof MaterialCommunityIcons.glyphMap, label: string, onPress: () => void, color: string, badge?: string }) {
  return (
    <Pressable style={styles.gridItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  timeWidget: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  checkInButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  checkInText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  gridLabel: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
});
