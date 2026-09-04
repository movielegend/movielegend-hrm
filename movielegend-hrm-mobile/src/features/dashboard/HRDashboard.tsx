import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, Image } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapData } from '../../api/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useCurrentAttendance, useAttendanceDashboardStats } from '../../hooks/useAttendance';
import { useMyTasks, useTasks } from '../../hooks/useTasks';
import Toast from 'react-native-toast-message';
import { LiveClock } from '../../components/LiveClock';
import { spacing } from '../../theme/spacing';

const appleTheme = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#111827',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  hint: '#9CA3AF',
  divider: '#ECEEF3',
  blueAccent: '#3B82F6',
  iconBg: '#F5F7FA',
  radiusCard: 24,
  radiusBtn: 16,
};

export function HRDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = typeof unreadData === 'number' ? unreadData : (unreadData as any)?.count || 0;
  const { data: currentAttendance } = useCurrentAttendance();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'ACTIVITY'>('TASKS');
  
  const { data: myTasks = [] } = useMyTasks({ limit: 10 });
  const { data: delegatedTasks } = useTasks({ 
    createdById: user?.id,
    limit: 10 
  });
  
  const { data: dashboardData } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/admin');
      return unwrapData(response) as any;
    }
  });

  const currentDateStr = new Date().toISOString().split('T')[0];
  const { data: attStats } = useAttendanceDashboardStats({ fromDate: currentDateStr, toDate: currentDateStr });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const dateString = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getInitials = (name?: string) => {
    if (!name) return 'HR';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Screen backgroundColor="#FAFAFA">
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfoWrapper}>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greetingText}>Xin chào 👋</Text>
              <Text style={styles.userName}>{user?.fullName || 'HR Manager'}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable style={styles.iconBtn} onPress={() => router.navigate('/hr/(tabs)/notifications' as any)}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.navigate('/hr/chat' as any)}>
              <MaterialCommunityIcons name="chat-processing-outline" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card - Chấm công */}
        <Pressable
          style={[styles.heroButton, currentAttendance?.state === 'CHECKED_IN' && { backgroundColor: '#F59E0B' }]}
          onPress={async () => {
            try {
              if (currentAttendance?.state === 'CHECKED_IN') {
                router.push('/hr/attendance/check-out');
              } else {
                router.push('/hr/attendance/check-in');
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
          {/* Decorative topographic wood grain background asset */}
          <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: appleTheme.radiusCard, overflow: 'hidden' }}>
            <Image
              source={require('../../../assets/topographic-contour-admin-v2.png')}
              style={[styles.heroTopographicBg, { tintColor: '#111827' }]}
              resizeMode="cover"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, zIndex: 1 }}>
            <View style={{ backgroundColor: currentAttendance?.state === 'CHECKED_IN' ? '#FFF' : appleTheme.blueAccent, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="check" size={16} color={currentAttendance?.state === 'CHECKED_IN' ? '#F59E0B' : '#FFF'} />
            </View>
            <Text style={[styles.heroTitle, currentAttendance?.state === 'CHECKED_IN' && { color: '#FFFFFF' }]}>
              {currentAttendance?.state === 'CHECKED_IN' ? 'Đang trong ca làm' : 'Vào ca / Chấm công'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 20, zIndex: 1 }}>
            <LiveClock style={[styles.heroSubtitle, currentAttendance?.state === 'CHECKED_IN' && { color: '#FFFFFF' }]} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 1 }}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={currentAttendance?.state === 'CHECKED_IN' ? '#FEF3C7' : appleTheme.textSecondary} />
            <Text style={{ color: currentAttendance?.state === 'CHECKED_IN' ? '#FEF3C7' : appleTheme.textSecondary, fontSize: 13 }}>Văn phòng Hà Nội</Text>
          </View>
        </Pressable>

        {/* Thao tác nhanh */}
        <Text style={styles.sectionTitleFolder}>Thao tác nhanh</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 16 }}
          style={{ marginHorizontal: -16 }}
        >

          <GridCard
            title="Lịch sử cá nhân"
            icon="history"
            onPress={() => router.navigate('/hr/attendance/history' as any)}
          />

          <GridCard
            title="QL Chấm công"
            icon="calendar-account-outline"
            onPress={() => router.navigate('/hr/attendance-management' as any)}
          />
          <GridCard
            title="Lịch làm việc"
            icon="calendar-clock-outline"
            onPress={() => router.navigate('/hr/schedule' as any)}
          />
          <GridCard
            title="Duyệt đơn"
            icon="file-document-check-outline"
            onPress={() => router.navigate('/hr/employee-requests' as any)}
          />
          <GridCard
            title="Công việc"
            icon="clipboard-text-outline"
            onPress={() => router.navigate('/hr/(tabs)/tasks' as any)}
          />
          <GridCard
            title="Hợp đồng"
            icon="text-box-check-outline"
            onPress={() => router.navigate('/hr/contracts' as any)}
          />
          <GridCard
            title="Vật tư"
            icon="laptop"
            onPress={() => router.navigate('/hr/assets' as any)}
          />
          <GridCard
            title="Góp ý"
            icon="message-draw"
            onPress={() => router.navigate('/hr/feedbacks' as any)}
          />
          <GridCard
            title="Bảng tin"
            icon="newspaper-variant-outline"
            onPress={() => router.navigate('/hr/(tabs)/newsfeed' as any)}
          />
          <GridCard
            title="Nhóm chat"
            icon="chat-processing-outline"
            onPress={() => router.navigate('/hr/chat' as any)}
          />
        </ScrollView>

        {/* Tổng quan HR */}
        <Text style={[styles.sectionTitleFolder, { marginTop: 16 }]}>Tổng quan công việc HR</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard
            label="Tổng nhân sự"
            value={dashboardData?.employees?.active?.toString() || '0'}
          />
          <SummaryCard
            label="Đi làm hôm nay"
            value={dashboardData?.attendanceToday?.checkedIn?.toString() || '0'}
          />
          <SummaryCard
            label="Đơn chờ duyệt"
            value={dashboardData?.leave?.pending?.toString() || '0'}
          />
          <SummaryCard
            label="Hợp đồng sắp hết"
            value={dashboardData?.contracts?.expiringSoon?.toString() || '0'}
          />
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
                    onPress={() => router.push(`/hr/my-tasks/${task.id}` as any)}
                    isCompleted={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                  />
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 12 }}>Chưa có công việc nào</Text>
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
                    onPress={() => router.push(`/hr/delegated-tasks/${task.id}` as any)}
                    isCompleted={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                  />
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 12 }}>Chưa có công việc nào giao đi</Text>
              )}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating AI Chat Button */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/hr/ai-chat' as any)}
      >
        <MaterialCommunityIcons name="robot-outline" size={28} color="#fff" />
      </Pressable>
    </Screen>
  );
}

function SummaryCard({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function GridCard({ title, icon, onPress }: any) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardIconBg}>
        <MaterialCommunityIcons name={icon} size={28} color="#111827" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </Pressable>
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
    backgroundColor: '#FAFAFA',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 4,
  },
  userInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  userInfo: {
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
    color: appleTheme.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: appleTheme.hint,
    fontWeight: '500',
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
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: appleTheme.radiusCard,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  heroTopographicBg: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    color: '#0A2540',
    fontSize: 15,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: appleTheme.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleFolder: {
    fontSize: 16,
    fontWeight: '800',
    color: appleTheme.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: 85,
    backgroundColor: appleTheme.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#8a99af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: appleTheme.textSecondary,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '23%',
    backgroundColor: appleTheme.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#8a99af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 10,
    color: appleTheme.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: appleTheme.primary,
  },
  section: {
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    marginTop: 16,
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
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  tasksContainer: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
    fontSize: 11,
    fontWeight: '700',
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
  }
});
