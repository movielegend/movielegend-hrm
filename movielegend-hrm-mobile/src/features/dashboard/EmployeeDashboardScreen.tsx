import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Dimensions, Alert, Image, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ContourHeroPattern } from './components/ContourHeroPattern';
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
import { LiveClock } from '../../components/LiveClock';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';

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

  const { data: levelProgress } = useQuery({
    queryKey: ['my-level-progress'],
    queryFn: () => levelingApi.getMyLevelProgress().catch(() => null),
  });

  const currentLevelNumber = levelProgress?.currentLevel?.levelNumber || 1;
  const levelColor = levelProgress?.currentLevel?.colorHex || LEVEL_COLORS[currentLevelNumber] || '#2196F3';
  const levelTitle = levelProgress?.currentLevel?.displayName || levelProgress?.currentLevel?.badgeTitle || LEVEL_DEFAULT_NAMES[currentLevelNumber] || `Cấp ${currentLevelNumber}`;

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

  const fullName = user?.fullName || user?.userCode || 'Nhân viên';
  const dateString = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

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
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.avatarWrapper}
              onPress={() => router.push('/employee/leveling' as any)}
            >
              <View style={styles.avatar}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
                )}
              </View>
              {/* Level Rank Badge on Avatar */}
              <View style={[styles.avatarLevelBadge, { backgroundColor: levelColor }]}>
                <Text style={styles.avatarLevelBadgeText}>{currentLevelNumber}</Text>
              </View>
            </Pressable>

            <View style={styles.greetingInfo}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>Xin chào 👋</Text>
                <Pressable
                  style={[
                    styles.levelPill,
                    { backgroundColor: `${levelColor}15`, borderColor: `${levelColor}40` },
                  ]}
                  onPress={() => router.push('/employee/leveling' as any)}
                >
                  <MaterialCommunityIcons name="crown" size={12} color={levelColor} />
                  <Text style={[styles.levelPillText, { color: levelColor }]}>
                    Lv.{currentLevelNumber} • {levelTitle}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/employee/(tabs)/newsfeed')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              {unreadCount > 0 && <View style={styles.badgeDot} />}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/employee/(tabs)/chat')}>
              <MaterialCommunityIcons name="chat-outline" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card (Đã chấm công) */}
        <Pressable 
          style={styles.heroCard}
          onPress={async () => {
            try {
              if (currentAttendance?.state === 'CHECKED_IN') {
                router.push('/employee/attendance/check-out' as any);
              } else {
                router.push('/employee/attendance/check-in' as any);
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
          <View style={styles.heroCardInner}>
            {/* Vân địa hình hữu cơ / Topographic contour ripples */}
            <ContourHeroPattern variant="blue" />

            {/* Top Status Header */}
            <View style={styles.heroHeaderRow}>
              <MaterialCommunityIcons 
                name={currentAttendance?.state === 'CHECKED_IN' ? 'check-circle' : 'check-circle'} 
                size={18} 
                color="#2563EB" 
              />
              <Text style={styles.heroStatusText}>
                {currentAttendance?.state === 'CHECKED_IN' ? 'Đang trong ca làm' : 'Vào ca / Chấm công'}
              </Text>
            </View>

            {/* Main Clock */}
            <View style={styles.heroTimeWrapper}>
              <LiveClock style={styles.heroTimeText} />
            </View>

            {/* Bottom Row */}
            <View style={styles.heroFooterRow}>
              <View style={styles.locationWrapper}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
                <Text style={styles.locationText}>Văn phòng Hà Nội</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Banner Cấp Bậc & Lộ Trình (Phong cách Apple UI tinh tế, sang trọng) */}
        <Pressable
          style={styles.levelAppleCard}
          onPress={() => router.push('/employee/leveling' as any)}
        >
          {/* Top Section */}
          <View style={styles.levelAppleHeaderRow}>
            <View style={styles.levelAppleLeft}>
              <View style={[styles.levelAppleIconCircle, { backgroundColor: `${levelColor}15`, borderColor: `${levelColor}30` }]}>
                <MaterialCommunityIcons name="crown" size={20} color={levelColor} />
              </View>
              <View style={styles.levelAppleTitleBlock}>
                <View style={styles.levelAppleBadgeRow}>
                  <Text style={styles.levelAppleTitle} numberOfLines={1}>
                    Level {currentLevelNumber}: {levelTitle}
                  </Text>
                  <View style={[styles.levelApplePillTag, { backgroundColor: `${levelColor}15` }]}>
                    <Text style={[styles.levelApplePillTagText, { color: levelColor }]}>
                      Lv.{currentLevelNumber}
                    </Text>
                  </View>
                </View>
                <Text style={styles.levelAppleSubtitle}>
                  {levelProgress?.nextLevel
                    ? `Tiến độ lên Level ${levelProgress.nextLevel.levelNumber}: ${levelProgress?.overallProgressPercent || 0}%`
                    : 'Cấp bậc danh dự tối cao'}
                </Text>
              </View>
            </View>

            <View style={[styles.levelAppleActionBtn, { backgroundColor: `${levelColor}10` }]}>
              <Text style={[styles.levelAppleActionText, { color: levelColor }]}>Lộ trình</Text>
              <MaterialCommunityIcons name="chevron-right" size={14} color={levelColor} />
            </View>
          </View>

          {/* Full-width elegant progress bar */}
          <View style={styles.levelAppleProgressContainer}>
            <View style={styles.levelAppleProgressTrack}>
              <View
                style={[
                  styles.levelAppleProgressFill,
                  {
                    width: `${Math.min(100, Math.max(4, levelProgress?.overallProgressPercent || 0))}%`,
                    backgroundColor: levelColor,
                  },
                ]}
              />
            </View>
            <View style={styles.levelAppleProgressFooter}>
              <Text style={styles.levelAppleProgressFooterText}>
                {levelProgress?.nextLevel
                  ? `Mục tiêu thăng cấp Level ${levelProgress.nextLevel.levelNumber}`
                  : 'Đạt cấp độ cao nhất'}
              </Text>
              <Text style={[styles.levelAppleProgressFooterPercent, { color: levelColor }]}>
                {levelProgress?.overallProgressPercent || 0}%
              </Text>
            </View>
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
                  <Text style={styles.vaultBannerTitle}>Ví Thưởng</Text>
                  <View style={styles.vipBadge}>
                    <Text style={styles.vipBadgeText}>VIP</Text>
                  </View>
                </View>
                <Text style={styles.vaultBannerPoints}>
                  Khả dụng: <Text style={styles.vaultBannerPointsBold}>{unlockedVaultPoints.toLocaleString('vi-VN')} đ</Text>
                  {totalGrantedPoints > 0 ? ` • Quỹ tích lũy: ${totalGrantedPoints.toLocaleString('vi-VN')} đ` : ''}
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
        <View style={[styles.section, styles.utilitySection]}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.gridContainer}>
            <GridItem
              icon="star-circle-outline"
              title="Cấp của bạn"
              color="#F59E0B"
              onPress={() => router.push('/employee/leveling' as any)}
            />
            <GridItem
              icon="briefcase-outline"
              title="Dự án"
              color="#3B82F6"
              onPress={() => router.push('/employee/level-projects' as any)}
            />
            <GridItem
              icon="gift-outline"
              title="Ví Thưởng"
              color="#059669"
              badge={isVaultEnabled ? 'VÍ' : undefined}
              badgeColor="#D97706"
              onPress={() => router.push('/employee/vault' as any)}
            />
            <GridItem
              icon="calendar-clock"
              title="Lịch sử công"
              color="#6366F1"
              onPress={() => router.push('/employee/attendance/history' as any)}
            />
            <GridItem
              icon="view-grid-outline"
              title="Ca làm việc"
              color="#EC4899"
              onPress={() => router.push('/employee/schedule')}
            />
            <GridItem
              icon="format-list-checks"
              title="Công việc"
              color="#10B981"
              badge={uncompletedTasksCount > 0 ? String(uncompletedTasksCount) : undefined}
              onPress={() => router.push('/employee/tasks')}
            />
            <GridItem
              icon="file-document-edit-outline"
              title="Đơn từ"
              color="#EA580C"
              onPress={() => router.push('/employee/requests')}
            />
            <GridItem
              icon="transit-connection-variant"
              title="Liên phòng"
              color="#0D9488"
              onPress={() => router.push('/employee/cross-department')}
            />
            <GridItem
              icon="file-document-outline"
              title="Hợp đồng"
              color="#8B5CF6"
              onPress={() => router.push('/employee/contracts')}
            />
            <GridItem
              icon="message-draw"
              title="Góp ý"
              color="#E11D48"
              onPress={() => router.push('/employee/feedbacks' as any)}
            />
            <GridItem
              icon="laptop"
              title="Tài sản"
              color="#64748B"
              onPress={() => router.push('/employee/assets')}
            />
            <GridItem
              icon="swap-horizontal"
              title="Đổi ca"
              color="#2563EB"
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
                .map((task) => {
                  let formattedDueDate = 'Không có hạn';
                  if (task.dueDate) {
                    const parsed = new Date(task.dueDate);
                    if (!isNaN(parsed.getTime())) {
                      formattedDueDate = parsed.toLocaleDateString('vi-VN');
                    }
                  }
                  return (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      priority={task.priority === 'HIGH' ? 'Cao' : task.priority === 'NORMAL' ? 'Trung bình' : 'Thấp'}
                      priorityColor={task.priority === 'HIGH' ? '#EF4444' : task.priority === 'NORMAL' ? '#F59E0B' : '#10B981'}
                      dueDate={formattedDueDate}
                      onPress={() => router.push(`/employee/tasks/${task.id}`)}
                      isCompleted={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                    />
                  );
                })
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
    marginBottom: 28,
    marginTop: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA',
    paddingHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  avatarLevelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  greetingInfo: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 1,
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
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  heroCard: {
    borderRadius: 24,
    marginBottom: spacing.xl,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  heroCardInner: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    minHeight: 148,
    justifyContent: 'space-between',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    zIndex: 2,
  },
  heroStatusText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heroTimeWrapper: {
    marginVertical: 4,
    zIndex: 2,
  },
  heroTimeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1.5,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  utilitySection: {
    marginBottom: -12,
  },
  sectionTitle: {
    fontSize: 17,
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
  levelAppleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  levelAppleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelAppleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  levelAppleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  levelAppleTitleBlock: {
    flex: 1,
  },
  levelAppleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  levelAppleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  levelApplePillTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  levelApplePillTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  levelAppleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  levelAppleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  levelAppleActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelAppleProgressContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  levelAppleProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  levelAppleProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  levelAppleProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelAppleProgressFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  levelAppleProgressFooterPercent: {
    fontSize: 11,
    fontWeight: '700',
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
