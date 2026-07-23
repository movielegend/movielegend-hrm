import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getDashboardByRole, getLeaderActivities } from '../../api/dashboard.api';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useMyTasks, useTasks } from '../../hooks/useTasks';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = Math.floor((width - spacing.lg * 2 - spacing.md * 2) / 3);

export function LeaderDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'ACTIVITY'>('TASKS');
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count || 0;
  const { data: currentAttendance } = useCurrentAttendance();
  const { data: myTasks } = useMyTasks({ limit: 10 });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', 'LEADER'],
    queryFn: () => getDashboardByRole('LEADER'),
  });

  const { data: delegatedTasks } = useTasks({ 
    createdById: user?.id,
    limit: 10 
  });
  
  const deptStats = (dashboardData?.department as any) || { activeEmployeeCount: 0, absentToday: 0, lateToday: 0, onLeaveToday: 0, checkedInCount: 0 };
  const checkedInCount = deptStats.checkedInCount || 0;

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
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/leader/chat' as any)}>
              <MaterialCommunityIcons name="chat-outline" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card (Đã chấm công) */}
        <Pressable 
          style={[styles.heroCard, currentAttendance?.state === 'CHECKED_IN' && { backgroundColor: '#F59E0B' }]}
          onPress={async () => {
            try {
              if (currentAttendance?.state === 'CHECKED_IN') {
                router.push('/leader/attendance/check-out' as any);
              } else {
                router.push('/leader/attendance/check-in' as any);
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể kiểm tra kết nối mạng.',
              });
            }
          }}
        >
          {/* SVG/Pattern background mock */}
          <View style={styles.heroCardPattern} />
          
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color={currentAttendance?.state === 'CHECKED_IN' ? '#FFFFFF' : '#3B82F6'} />
            <Text style={[styles.statusBadgeText, currentAttendance?.state === 'CHECKED_IN' && { color: '#FFFFFF' }]}>
              {currentAttendance?.state === 'CHECKED_IN' ? 'Đang trong ca làm' : 'Vào ca / Chấm công'}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeValue, currentAttendance?.state === 'CHECKED_IN' && { color: '#FFFFFF' }]}>{timeString}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={currentAttendance?.state === 'CHECKED_IN' ? '#FEF3C7' : '#6B7280'} />
            <Text style={[styles.locationText, currentAttendance?.state === 'CHECKED_IN' && { color: '#FEF3C7' }]}>Văn phòng Hà Nội</Text>
          </View>
        </Pressable>

        {/* Thao tác nhanh (Quick Actions - Leader Features) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.gridContainer}>
            <GridItem icon="file-document-multiple" title="Duyệt đơn" onPress={() => router.push('/leader/(tabs)/approvals' as any)} />
            <GridItem icon="calendar-clock" title="Ca làm việc" onPress={() => router.push('/leader/schedule' as any)} />
            <GridItem icon="swap-horizontal" title="Chấm công" onPress={() => router.push('/leader/attendance' as any)} />
            <GridItem icon="view-grid-outline" title="Phân ca" onPress={() => router.push('/leader/shift-management' as any)} />
            <GridItem icon="account-tie-outline" title="Nhân sự" onPress={() => router.push('/leader/employees' as any)} />
            <GridItem icon="file-document-outline" title="Hợp đồng" onPress={() => router.push('/leader/contracts' as any)} />
            <GridItem icon="laptop" title="Tài sản" onPress={() => router.push('/leader/assets' as any)} />
            <GridItem icon="alert-circle-outline" title="Sự cố" onPress={() => router.push('/leader/asset-incidents' as any)} />
            <GridItem icon="message-draw" title="Góp ý" onPress={() => router.push('/leader/feedbacks' as any)} />
          </View>
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

        {/* Tabs: Công việc của tôi / Việc tôi giao */}
        <View style={styles.section}>
          <View style={styles.tabContainer}>
            <Pressable 
              onPress={() => setActiveTab('TASKS')} 
              style={[styles.tabButton, activeTab === 'TASKS' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === 'TASKS' && styles.tabTextActive]}>Công việc của tôi</Text>
            </Pressable>
            <Pressable 
              onPress={() => setActiveTab('ACTIVITY')} 
              style={[styles.tabButton, activeTab === 'ACTIVITY' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === 'ACTIVITY' && styles.tabTextActive]}>Việc tôi giao</Text>
            </Pressable>
          </View>

          {activeTab === 'TASKS' ? (
            <View style={styles.tasksContainer}>
              {myTasks?.items && myTasks.items?.length > 0 ? (
                [...myTasks.items]
                  .sort((a, b) => {
                    const isACompleted = a.status === 'COMPLETED' || a.status === 'CANCELLED';
                    const isBCompleted = b.status === 'COMPLETED' || b.status === 'CANCELLED';
                    if (isACompleted && !isBCompleted) return 1;
                    if (!isACompleted && isBCompleted) return -1;
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                  })
                  .slice(0, 5)
                  .map((task) => (
                  <TaskCard 
                    key={task.id}
                    title={task.title}
                    priority={task.priority === 'HIGH' ? 'Cao' : task.priority === 'NORMAL' ? 'Trung bình' : 'Thấp'}
                    priorityColor={task.priority === 'HIGH' ? '#EF4444' : task.priority === 'NORMAL' ? '#F59E0B' : '#10B981'}
                    dueDate={new Date(task.dueDate).toLocaleDateString('vi-VN')}
                    onPress={() => router.push(`/leader/tasks/${task.id}` as any)}
                    isCompleted={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                  />
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: spacing.md }}>Chưa có công việc nào</Text>
              )}
            </View>
          ) : (
            <View style={styles.tasksContainer}>
              {delegatedTasks?.items && delegatedTasks.items?.length > 0 ? (
                [...delegatedTasks.items]
                  .sort((a, b) => {
                    const isACompleted = a.status === 'COMPLETED' || a.status === 'CANCELLED';
                    const isBCompleted = b.status === 'COMPLETED' || b.status === 'CANCELLED';
                    if (isACompleted && !isBCompleted) return 1;
                    if (!isACompleted && isBCompleted) return -1;
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                  })
                  .slice(0, 5)
                  .map((task) => (
                  <TaskCard 
                    key={task.id}
                    title={task.title}
                    priority={task.priority === 'HIGH' ? 'Cao' : task.priority === 'NORMAL' ? 'Trung bình' : 'Thấp'}
                    priorityColor={task.priority === 'HIGH' ? '#EF4444' : task.priority === 'NORMAL' ? '#F59E0B' : '#10B981'}
                    dueDate={new Date(task.dueDate).toLocaleDateString('vi-VN')}
                    onPress={() => router.push(`/leader/tasks/${task.id}` as any)}
                    isCompleted={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                  />
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: spacing.md }}>Chưa có công việc nào giao đi</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating AI Chat Button */}
      <Pressable 
        style={styles.fab}
        onPress={() => router.push('/employee/ai-chat' as any)}
      >
        <MaterialCommunityIcons name="robot-outline" size={28} color="#fff" />
      </Pressable>
    </Screen>
  );
}

function GridItem({ icon, title, onPress, badge }: any) {
  return (
    <Pressable style={styles.gridItem} onPress={onPress}>
      <View style={styles.gridIconContainer}>
        <MaterialCommunityIcons name={icon} size={28} color="#111827" />
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridTitle}>{title}</Text>
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

function ActivityItem({ title, time, icon, color }: any) {
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconWrapper, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
}

function TaskCard({ title, priority, priorityColor, dueDate, onPress, isCompleted }: any) {
  return (
    <Pressable style={[styles.taskCard, isCompleted && { opacity: 0.6, backgroundColor: '#F9FAFB' }]} onPress={onPress}>
      <View style={styles.taskIconWrapper}>
        <MaterialCommunityIcons 
          name={isCompleted ? "check-circle" : "checkbox-blank-circle-outline"} 
          size={24} 
          color={isCompleted ? "#10B981" : "#D1D5DB"} 
        />
      </View>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, isCompleted && { textDecorationLine: 'line-through', color: '#9CA3AF' }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.taskFooter}>
          <View style={styles.taskMeta}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={14} color="#6B7280" />
            <Text style={styles.taskDueDate}>{dueDate}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>{priority}</Text>
          </View>
        </View>
      </View>
    </Pressable>
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
    borderWidth: 1,
    borderColor: '#ECEEF3',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    aspectRatio: 1,
  },
  gridIconContainer: {
    marginBottom: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
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
    flexDirection: 'row',
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
    alignItems: 'flex-start',
  },
  taskIconWrapper: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: spacing.sm,
  },
  activityIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  }
});
