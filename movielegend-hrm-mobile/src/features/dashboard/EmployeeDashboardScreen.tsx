import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Dimensions, Alert, Image, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../providers/AuthProvider';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useMySchedule } from '../../hooks/useShifts';
import { useMyTasks } from '../../hooks/useTasks';
import { getMyVault } from '../../api/employees.api';
import { scheduleShiftNotifications, scheduleTaskNotifications } from '../../services/NotificationService';
import { Screen } from '../../components/Screen';
import { spacing } from '../../theme/spacing';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';


const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = Math.floor((width - spacing.lg * 2 - spacing.md * 2) / 3);

export function EmployeeDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentAttendance } = useCurrentAttendance();
  const { data: schedule } = useMySchedule();
  const { data: myTasks } = useMyTasks({ limit: 100 });
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count || 0;
  const { data: myVault } = useQuery({
    queryKey: ['my-vault'],
    queryFn: getMyVault,
  });

  const isVaultEnabled = Boolean(myVault?.isVaultEnabled || user?.isRewardVaultEnabled);
  const unlockedVaultPoints = myVault?.stats?.unlockedPoints || 0;
  const totalGrantedPoints = myVault?.stats?.totalGrantedPoints || 0;

  useEffect(() => {
    if (schedule && schedule.length > 0) {
      scheduleShiftNotifications(schedule).catch(console.error);
    }
  }, [schedule]);

  useEffect(() => {
    if (myTasks && myTasks.items && myTasks.items?.length > 0) {
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
  const timeString = currentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const uncompletedTasksCount = myTasks?.items?.filter(t => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length || 0;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <Screen backgroundColor="#FAFAFA">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
              )}
            </View>
          <View style={styles.headerInfo}>
            <Text style={styles.greetingText}>Xin chào,</Text>
            <Text style={styles.userName}>{fullName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/employee/(tabs)/newsfeed')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/employee/(tabs)/chat')}>
              <MaterialCommunityIcons name="chat-outline" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card - Chấm công */}
        <Pressable
          style={[styles.heroCard, currentAttendance?.state === 'CHECKED_IN' && { backgroundColor: '#F59E0B' }]}
          onPress={async () => {
            try {
              if (currentAttendance?.state === 'CHECKED_IN') {
                router.push('/employee/attendance/check-out');
              } else {
                router.push('/employee/attendance/check-in');
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
          <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: 24, overflow: 'hidden' }}>
            <Image
              source={require('../../../assets/topographic-contour-employee-v2.png')}
              style={styles.heroTopographicBg}
              resizeMode="cover"
            />
          </View>
          

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

        {/* Banner Ví Thưởng Tết & Nhân Tài (Hiển thị nổi bật khi được mở quyền) */}
        {isVaultEnabled && (
          <Pressable
            style={styles.vaultBanner}
            onPress={() => router.push('/employee/vault' as any)}
          >
            <View style={styles.vaultBannerLeft}>
              <View style={styles.vaultBannerIconWrap}>
                <MaterialCommunityIcons name="gift" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={styles.vaultBannerTitle}>Ví Thưởng Tết & Giữ Chân</Text>
                  <View style={styles.vipBadge}>
                    <Text style={styles.vipBadgeText}>VIP</Text>
                  </View>
                </View>
                <Text style={styles.vaultBannerPoints}>
                  Khả dụng: <Text style={styles.vaultBannerPointsBold}>{unlockedVaultPoints.toLocaleString('vi-VN')} đ</Text>
                  {totalGrantedPoints > 0 ? ` • Quỹ cam kết: ${totalGrantedPoints.toLocaleString('vi-VN')} đ` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.vaultBannerRight}>
              <Text style={styles.vaultBannerActionText}>Mở ví</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#D97706" />
            </View>
          </Pressable>
        )}

        {/* Tiện ích (Grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích cá nhân</Text>
          <View style={styles.gridContainer}>
            <GridItem
              icon="star-circle-outline"
              title="Cấp của bạn"
              onPress={() => router.push('/employee/leveling' as any)}
            />
            <GridItem
              icon="briefcase-outline"
              title="Dự án"
              onPress={() => router.push('/employee/level-projects' as any)}
            />

            <GridItem
              icon="gift-outline"
              title="Ví Thưởng Tết"
              badge={isVaultEnabled ? 'VIP' : undefined}
              badgeColor="#D97706"
              onPress={() => router.push('/employee/vault' as any)}
            />
            <GridItem
              icon="history"
              title="Lịch sử chấm công"
              onPress={() => router.push('/employee/attendance/history' as any)}
            />
            <GridItem
              icon="calendar-clock"
              title="Ca làm việc"
              onPress={() => router.push('/employee/schedule')}
            />
            <GridItem
              icon="format-list-checks"
              title="Công việc"
              badge={uncompletedTasksCount > 0 ? String(uncompletedTasksCount) : undefined}
              onPress={() => router.push('/employee/tasks')}
            />
            <GridItem
              icon="file-document-edit-outline"
              title="Đơn từ"
              onPress={() => router.push('/employee/requests')}
            />
            <GridItem
              icon="transit-connection-variant"
              title="Yêu cầu Liên phòng"
              onPress={() => router.push('/employee/cross-department')}
            />
            <GridItem
              icon="cash-multiple"
              title="Phiếu lương"
              onPress={() => Alert.alert('Thông báo', 'Chức năng đang được phát triển')}
            />
            <GridItem
              icon="text-box-check-outline"
              title="Hợp đồng"
              onPress={() => router.push('/employee/contracts')}
            />
            <GridItem
              icon="message-draw"
              title="Góp ý"
              onPress={() => router.push('/employee/feedbacks' as any)}
            />
            <GridItem
              icon="laptop"
              title="Tài sản"
              onPress={() => router.push('/employee/assets')}
            />
            <GridItem
              icon="swap-horizontal"
              title="Đổi ca"
              onPress={() => router.push('/employee/shift-swaps')}
            />
          </View>
        </View>

        {/* Công việc của tôi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công việc của tôi</Text>
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
                    onPress={() => router.push(`/employee/tasks/${task.id}`)}
                    isCompleted={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                  />
                ))
            ) : (
              <TaskCard
                title="Cập nhật báo cáo tiến độ tuần"
                priority="Trung bình"
                priorityColor="#F59E0B"
                dueDate="Ngày mai"
                onPress={() => router.push('/employee/tasks')}
              />
            )}
          </View>
        </View>

      </ScrollView>

      {/* Floating AI Chat Button */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/employee/ai-chat')}
      >
        <MaterialCommunityIcons name="robot-outline" size={28} color="#fff" />
      </Pressable>
    </Screen>
  );
}

function GridItem({ icon, title, onPress, color, badge, badgeColor }: any) {
  return (
    <Pressable style={styles.gridItem} onPress={onPress}>
      <View style={styles.gridIconContainer}>
        <MaterialCommunityIcons name={icon} size={28} color={color || "#111827"} />
        {badge && (
          <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : undefined]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridTitle}>{title}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#DBEAFE',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
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
  vaultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  vaultBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vaultBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vaultBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  vipBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  vaultBannerPoints: {
    fontSize: 12,
    color: '#78350F',
  },
  vaultBannerPointsBold: {
    fontWeight: '800',
    color: '#059669',
  },
  vaultBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vaultBannerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
});
