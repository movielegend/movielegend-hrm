import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getDashboardByRole } from '../../api/dashboard.api';

export function LeaderDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', 'LEADER'],
    queryFn: () => getDashboardByRole('LEADER'),
  });
  
  const deptStats = (dashboardData?.department as any) || { activeEmployeeCount: 0, absentToday: 0, lateToday: 0, onLeaveToday: 0 };
  // Approximate checked in today:
  const checkedInCount = Math.max(0, deptStats.activeEmployeeCount - deptStats.absentToday - deptStats.onLeaveToday);

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

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate week dates dynamically
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Find Monday of the current week
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1));

  const weekDates = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + index);
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return {
      day: dayNames[d.getDay()],
      date: d.getDate().toString().padStart(2, '0'),
      active: d.toDateString() === today.toDateString()
    };
  });

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
              <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
            </View>
            <Text style={styles.userName}>{user?.fullName || 'Quản trị viên'}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.chatBtn} onPress={() => router.push('/(chat)')}>
              <MaterialCommunityIcons name="chat-outline" size={24} color={colors.primaryDark} />
            </Pressable>
            <Pressable style={styles.bellBtn} onPress={() => router.push('/leader/notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primaryDark} />
            </Pressable>
          </View>
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

        {/* Nút Vào ca */}
        <Pressable 
          style={styles.heroButton}
          onPress={() => router.push('/leader/attendance/check-in')}
        >
          <View>
            <Text style={styles.heroTitle}>Vào ca</Text>
            <Text style={styles.heroSubtitle}>{timeString}</Text>
          </View>
          <View style={styles.fingerprintIcon}>
            <MaterialCommunityIcons name="fingerprint" size={32} color={colors.primaryDark} />
          </View>
        </Pressable>

        <View style={styles.teamStatsContainer}>
          <Text style={styles.sectionTitleFolder}>Thống kê nhóm hôm nay</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{deptStats.activeEmployeeCount}</Text>
              <Text style={styles.statLabel}>Tổng NV</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{checkedInCount}</Text>
              <Text style={styles.statLabel}>Đã check-in</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{deptStats.lateToday}</Text>
              <Text style={styles.statLabel}>Đi trễ</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>{deptStats.absentToday}</Text>
              <Text style={styles.statLabel}>Vắng mặt</Text>
            </View>
          </View>
        </View>

        {/* Thư mục */}
        <Text style={styles.sectionTitleFolder}>Thư mục</Text>
        <View style={styles.grid}>
          <GridCard 
            title="Lịch sử chấm công phòng ban" 
            icon="swap-horizontal" 
            iconBg="#E0F2FE" 
            iconColor="#3B82F6"
            onPress={() => router.push('/leader/attendance')}
          />
          <GridCard 
            title="Phân ca" 
            icon="view-grid" 
            iconBg="#E0E7FF" 
            iconColor="#6366F1"
            onPress={() => router.push('/leader/shift-management')}
          />
          <GridCard 
            title="Nhân sự phòng" 
            icon="account-tie" 
            iconBg="#D1FAE5" 
            iconColor="#10B981"
            onPress={() => router.push('/leader/employees')}
          />
          <GridCard 
            title="Sự cố tài sản" 
            icon="alert-circle-outline" 
            iconBg="#FFE4E6" 
            iconColor="#F43F5E"
            onPress={() => router.push('/leader/asset-incidents')}
          />
          <GridCard 
            title="Hợp đồng" 
            icon="file-document-outline" 
            iconBg="#FEF3C7" 
            iconColor="#D97706"
            onPress={() => router.push('/leader/contracts')}
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
    minHeight: '100%',
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
    backgroundColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#4F46E5',
    fontSize: 20,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
    backgroundColor: '#22C55E',
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
  },
  teamStatsContainer: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  }
});
