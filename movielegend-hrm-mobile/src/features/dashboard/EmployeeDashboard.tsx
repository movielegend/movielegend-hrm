import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { hasPermission } from '../../utils/permissions';
import { useCurrentAttendance } from '../../hooks/useAttendance';

export function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const { data: currentAttendance, isLoading: isAttendanceLoading } = useCurrentAttendance();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Generate week dates mock
  const weekDates = [
    { day: 'T2', date: '06', active: false },
    { day: 'T3', date: '07', active: false },
    { day: 'T4', date: '08', active: true },
    { day: 'T5', date: '09', active: false },
    { day: 'T6', date: '10', active: false },
    { day: 'T7', date: '11', active: false },
    { day: 'CN', date: '12', active: false },
  ];

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>HĐ</Text>
            </View>
            <Text style={styles.userName}>{user?.fullName || user?.phone || 'Học Đinh'}</Text>
          </View>
          <Pressable style={styles.bellBtn} onPress={() => router.push('/employee/notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primaryDark} />
          </Pressable>
        </View>

        {/* Lịch làm việc */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch làm việc</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
          {weekDates.map((item, index) => (
            <View key={index} style={[styles.dateItem, item.active && styles.dateItemActive]}>
              <Text style={[styles.dayText, item.active && styles.dayTextActive]}>{item.day}</Text>
              <Text style={[styles.dateTextNum, item.active && styles.dateTextNumActive]}>{item.date}</Text>
              {item.active && <View style={styles.dot} />}
            </View>
          ))}
        </ScrollView>

        {/* Nút Vào ca / Ra ca */}
        <Pressable 
          style={[styles.heroButton, currentAttendance?.state === 'CHECKED_IN' && { backgroundColor: '#F59E0B' }]}
          onPress={() => {
            if (currentAttendance?.state === 'CHECKED_IN') {
              router.push('/employee/attendance/check-out');
            } else {
              router.push('/employee/attendance/check-in');
            }
          }}
        >
          <View>
            <Text style={styles.heroTitle}>
              {currentAttendance?.state === 'CHECKED_IN' ? 'Ra ca' : 'Vào ca'}
            </Text>
            <Text style={styles.heroSubtitle}>{timeString}</Text>
          </View>
          <View style={styles.fingerprintIcon}>
            <MaterialCommunityIcons name="fingerprint" size={32} color={colors.primaryDark} />
          </View>
        </Pressable>

        {/* Thư mục */}
        <Text style={styles.sectionTitleFolder}>Thư mục</Text>
        <View style={styles.grid}>
          <GridCard 
            title="Yêu cầu" 
            icon="clipboard-text" 
            iconBg="#FEF3C7" // Yellow
            iconColor="#F59E0B"
            badges={[{color: '#FEF2F2', text: '#EF4444', val: '0'}, {color: '#F0FDF4', text: '#22C55E', val: '0'}, {color: '#FEF2F2', text: '#EF4444', val: '0'}]}
            onPress={() => router.push('/employee/requests')}
          />
          <GridCard 
            title="Chấm công" 
            icon="swap-horizontal" 
            iconBg="#E0F2FE" // Blue
            iconColor="#3B82F6"
            onPress={() => router.push('/employee/attendance')}
          />
          <GridCard 
            title="Xếp ca" 
            icon="view-grid" 
            iconBg="#FFEDD5" // Orange
            iconColor="#F97316"
            onPress={() => router.push('/employee/schedule')}
          />
          <GridCard 
            title="Phiếu lương" 
            icon="file-document" 
            iconBg="#D1FAE5" // Green
            iconColor="#10B981"
            onPress={() => {}}
          />
          <GridCard 
            title="Khóa học" 
            icon="book-open-page-variant" 
            iconBg="#FFE4E6" // Rose
            iconColor="#F43F5E"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function GridCard({ title, icon, iconBg, iconColor, badges, onPress }: any) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.cardIconBg, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      {badges && (
        <View style={styles.badgeRow}>
          {badges.map((b: any, i: number) => (
            <View key={i} style={[styles.badge, { backgroundColor: b.color }]}>
              <Text style={{ color: b.text, fontSize: 10, fontWeight: 'bold' }}>{b.val}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#C7D2FE', // Indigo 200
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#4F46E5', // Indigo 600
    fontSize: 20,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  calendarStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dateItem: {
    width: 50,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateItemActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  dayText: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  dayTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateTextNum: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  dateTextNumActive: {
    color: colors.primary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  heroButton: {
    backgroundColor: '#22C55E', // Green 500 (Vibrant)
    borderRadius: 20,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginTop: 4,
  },
  fingerprintIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleFolder: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  }
});
