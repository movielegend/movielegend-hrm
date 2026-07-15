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

  // Date format for the header
  const headerDate = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
            </View>
            <View style={styles.greetingInfo}>
              <Text style={styles.greetingText}>Xin chào 👋</Text>
              <Text style={styles.userName}>{user?.fullName || 'Quản lý'}</Text>
              <Text style={styles.dateText}>{headerDate}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/leader/notifications' as any)}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              <View style={styles.badgeDot} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(chat)' as any)}>
              <MaterialCommunityIcons name="chat-outline" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card (Đã chấm công) */}
        <Pressable 
          style={styles.heroCard}
          onPress={() => router.push('/leader/attendance/check-in' as any)}
        >
          {/* SVG/Pattern background mock */}
          <View style={styles.heroCardPattern} />
          
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#3B82F6" />
            <Text style={styles.statusBadgeText}>Vào ca / Chấm công</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeValue}>{timeString.split(' ')[0]}</Text>
            <Text style={styles.timeAmPm}>{timeString.split(' ')[1] || 'AM'}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>Văn phòng Hà Nội</Text>
          </View>
        </Pressable>

        {/* Thao tác nhanh (Quick Actions - Leader Features) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
            <QuickAction icon="swap-horizontal" title="Chấm công" onPress={() => router.push('/leader/attendance' as any)} />
            <QuickAction icon="view-grid-outline" title="Phân ca" onPress={() => router.push('/leader/shift-management' as any)} />
            <QuickAction icon="account-tie-outline" title="Nhân sự" onPress={() => router.push('/leader/employees' as any)} />
            <QuickAction icon="file-document-outline" title="Hợp đồng" onPress={() => router.push('/leader/contracts' as any)} />
            <QuickAction icon="alert-circle-outline" title="Sự cố" onPress={() => router.push('/leader/asset-incidents' as any)} />
          </ScrollView>
        </View>

        {/* Tổng quan nhóm hôm nay (Team Stats) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê nhóm hôm nay</Text>
          <View style={styles.statsRow}>
            <StatCard title="Tổng NV" value={deptStats.activeEmployeeCount} color="#111827" />
            <StatCard title="Đã check-in" value={checkedInCount} color="#10B981" />
            <StatCard title="Đi trễ" value={deptStats.lateToday} color="#F59E0B" />
            <StatCard title="Vắng mặt" value={deptStats.absentToday} color="#EF4444" />
          </View>
        </View>

        {/* Công việc của tôi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công việc của tôi</Text>
          <View style={styles.tasksContainer}>
            <TaskCard 
              title="Duyệt đơn xin nghỉ của nhân viên"
              priority="Cao"
              priorityColor="#EF4444"
              dueDate="Hôm nay"
            />
            <TaskCard 
              title="Phân ca làm việc tuần sau"
              priority="Trung bình"
              priorityColor="#F59E0B"
              dueDate="Ngày mai"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickAction({ icon, title, onPress }: any) {
  return (
    <Pressable style={styles.quickActionCard} onPress={onPress}>
      <View style={styles.quickActionIconBg}>
        <MaterialCommunityIcons name={icon} size={26} color="#111827" />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </Pressable>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function TaskCard({ title, priority, priorityColor, dueDate }: any) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.taskFooter}>
        <View style={styles.taskMeta}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color="#6B7280" />
          <Text style={styles.taskDueDate}>{dueDate}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>{priority}</Text>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B5563',
  },
  greetingInfo: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  heroCardPattern: {
    position: 'absolute',
    right: -40,
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 20,
    borderColor: '#EFF6FF',
    opacity: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  timeAmPm: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  quickActions: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  quickActionCard: {
    width: 88,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  tasksContainer: {
    gap: spacing.md,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  taskHeader: {
    marginBottom: spacing.sm,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDueDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  }
});
