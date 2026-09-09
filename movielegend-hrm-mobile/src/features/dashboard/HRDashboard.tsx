import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, Image, Dimensions } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapData } from '../../api/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useCurrentAttendance, useAttendanceDashboardStats } from '../../hooks/useAttendance';
import { useMyTasks, useTasks } from '../../hooks/useTasks';
import { getMyVault } from '../../api/employees.api';
import { getNextVaultMilestone } from '../vault/vault-utils';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
import Toast from 'react-native-toast-message';
import { LiveClock } from '../../components/LiveClock';
import { ContourHeroPattern } from './components/ContourHeroPattern';
import { spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = Math.floor((width - spacing.lg * 2 - spacing.md * 2) / 3);

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
  
  const { data: myTasks } = useMyTasks({ limit: 10 });
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

  const { data: myVault } = useQuery({
    queryKey: ['my-vault', user?.id],
    queryFn: getMyVault,
    enabled: Boolean(user?.id),
  });

  const { data: levelProgress } = useQuery({
    queryKey: ['my-level-progress', user?.id],
    queryFn: () => levelingApi.getMyLevelProgress().catch(() => null),
    enabled: Boolean(user?.id),
  });

  const currentLevelNumber = levelProgress?.currentLevel?.levelNumber || 5;
  const levelColor = levelProgress?.currentLevel?.colorHex || LEVEL_COLORS[currentLevelNumber] || '#FF9800';
  const levelTitle = levelProgress?.currentLevel?.displayName || levelProgress?.currentLevel?.badgeTitle || LEVEL_DEFAULT_NAMES[currentLevelNumber] || `Cấp ${currentLevelNumber}`;

  const isVaultEnabled = Boolean(myVault?.isVaultEnabled || user?.isRewardVaultEnabled);
  const unlockedVaultPoints = myVault?.stats?.unlockedPoints || 0;
  const totalGrantedPoints = myVault?.stats?.totalGrantedPoints || 0;

  const vaultMilestone = useMemo(() => {
    return getNextVaultMilestone(myVault, new Date());
  }, [myVault]);

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
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    if (words.length >= 2 && firstWord && lastWord && firstWord[0] && lastWord[0]) {
      return (firstWord[0] + lastWord[0]).toUpperCase();
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
            <Pressable 
              style={styles.avatarWrapper}
              onPress={() => router.push('/hr/leveling' as any)}
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

            <View style={styles.userInfo}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>Xin chào 👋</Text>
                <Pressable
                  style={[
                    styles.levelPill,
                    { backgroundColor: `${levelColor}15`, borderColor: `${levelColor}40` },
                  ]}
                  onPress={() => router.push('/hr/leveling' as any)}
                >
                  <MaterialCommunityIcons name="crown" size={12} color={levelColor} />
                  <Text style={[styles.levelPillText, { color: levelColor }]}>
                    Lv.{currentLevelNumber} • {levelTitle}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.userName} numberOfLines={1}>{user?.fullName || 'HR Manager'}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.navigate('/hr/(tabs)/notifications' as any)}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              {unreadCount > 0 && <View style={styles.badgeDot} />}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.navigate('/hr/chat' as any)}>
              <MaterialCommunityIcons name="chat-outline" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card (Đã chấm công) */}
        <Pressable
          style={styles.heroButton}
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
          <View style={styles.heroCardInner}>
            {/* Vân địa hình hữu cơ / Topographic contour ripples */}
            <ContourHeroPattern variant="slate" />

            {/* Top Status Header */}
            <View style={styles.heroHeaderRow}>
              <MaterialCommunityIcons 
                name={currentAttendance?.state === 'CHECKED_IN' ? 'check-circle' : 'check-circle'} 
                size={18} 
                color="#475569" 
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
          onPress={() => router.push('/hr/leveling' as any)}
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
                  : 'Đã hoàn thành toàn bộ lộ trình cấp bậc'}
              </Text>
              <Text style={[styles.levelAppleProgressFooterPercent, { color: levelColor }]}>
                {levelProgress?.overallProgressPercent || 0}%
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Banner Ví Thưởng & Vạch thời gian đếm ngược đến hạn rút (Hiển thị nổi bật khi được trao điểm/mở quyền) */}
        {isVaultEnabled && (
          <Pressable
            style={styles.vaultAppleCard}
            onPress={() => router.push('/employee/vault' as any)}
          >
            {/* Top Section */}
            <View style={styles.vaultAppleHeaderRow}>
              <View style={styles.vaultAppleLeft}>
                <View style={styles.vaultAppleIconCircle}>
                  <MaterialCommunityIcons name="gift" size={22} color="#D97706" />
                </View>
                <View style={styles.vaultAppleTitleBlock}>
                  <View style={styles.vaultAppleBadgeRow}>
                    <Text style={styles.vaultAppleTitle} numberOfLines={1}>
                      Ví Thưởng Tích Lũy
                    </Text>
                    <View style={styles.vaultAppleVipBadge}>
                      <Text style={styles.vaultAppleVipBadgeText}>VIP</Text>
                    </View>
                  </View>
                  <Text style={styles.vaultAppleSubtitle}>
                    Khả dụng: <Text style={styles.vaultAppleSubtitleBold}>{unlockedVaultPoints.toLocaleString('vi-VN')} đ</Text>
                    {totalGrantedPoints > 0 ? ` • Quỹ: ${totalGrantedPoints.toLocaleString('vi-VN')} đ` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.vaultAppleActionBtn}>
                <Text style={styles.vaultAppleActionText}>Mở ví</Text>
                <MaterialCommunityIcons name="chevron-right" size={14} color="#92400E" />
              </View>
            </View>

            {/* Vạch thời gian & Đếm ngược đến hạn rút */}
            {vaultMilestone ? (
              <View style={styles.vaultAppleProgressContainer}>
                <View style={styles.vaultAppleProgressTrack}>
                  <View
                    style={[
                      styles.vaultAppleProgressFill,
                      {
                        width: `${Math.min(100, Math.max(4, vaultMilestone.progressPercent))}%`,
                        backgroundColor: vaultMilestone.isAllUnlocked ? '#059669' : '#D97706',
                      },
                    ]}
                  />
                </View>
                <View style={styles.vaultAppleProgressFooter}>
                  <View style={styles.vaultAppleProgressFooterLeft}>
                    <MaterialCommunityIcons
                      name={vaultMilestone.isAllUnlocked ? 'check-decagram' : 'timer-sand'}
                      size={13}
                      color={vaultMilestone.isAllUnlocked ? '#059669' : '#D97706'}
                    />
                    <Text style={styles.vaultAppleProgressFooterText}>
                      {vaultMilestone.isAllUnlocked
                        ? 'Đã mở khóa tất cả các đợt rút'
                        : `Mở ${vaultMilestone.title} (${vaultMilestone.unlockDateFormatted})`}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.vaultAppleProgressFooterPercent,
                      { color: vaultMilestone.isAllUnlocked ? '#059669' : '#D97706' },
                    ]}
                  >
                    {vaultMilestone.isAllUnlocked
                      ? '100% Hoàn tất'
                      : `Còn ${vaultMilestone.days} ngày ${vaultMilestone.hours}h`}
                  </Text>
                </View>
              </View>
            ) : null}
          </Pressable>
        )}

        {/* Tiện ích (HR Features) - Đồng bộ cấu trúc Grid như Leader */}
        <View style={[styles.section, styles.utilitySection]}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.gridContainer}>
            <GridItem 
              icon="star-circle-outline" 
              title="Cấp của bạn" 
              color="#F59E0B" 
              onPress={() => router.push('/hr/leveling' as any)} 
            />
            <GridItem 
              icon="briefcase-outline" 
              title="Dự án" 
              color="#3B82F6" 
              onPress={() => router.push('/leader/level-projects' as any)} 
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
              icon="clipboard-check-outline" 
              title="Duyệt level" 
              color="#8B5CF6" 
              onPress={() => router.push('/hr/leveling' as any)} 
            />
            <GridItem 
              icon="history" 
              title="Lịch sử công" 
              color="#6366F1" 
              onPress={() => router.navigate('/hr/attendance/history' as any)} 
            />
            <GridItem 
              icon="calendar-account-outline" 
              title="QL Chấm công" 
              color="#2563EB" 
              onPress={() => router.navigate('/hr/attendance-management' as any)} 
            />
            <GridItem 
              icon="calendar-clock-outline" 
              title="Lịch làm việc" 
              color="#0D9488" 
              onPress={() => router.navigate('/hr/schedule' as any)} 
            />
            <GridItem 
              icon="file-document-check-outline" 
              title="Duyệt đơn" 
              color="#EA580C" 
              badge={dashboardData?.leave?.pending > 0 ? dashboardData.leave.pending : undefined}
              onPress={() => router.navigate('/hr/employee-requests' as any)} 
            />
            <GridItem 
              icon="text-box-check-outline" 
              title="Hợp đồng" 
              color="#3B82F6" 
              badge={dashboardData?.contracts?.expiringSoon > 0 ? dashboardData.contracts.expiringSoon : undefined}
              onPress={() => router.navigate('/hr/contracts' as any)} 
            />
            <GridItem 
              icon="view-grid-outline" 
              title="Phân ca" 
              color="#EC4899" 
              onPress={() => router.navigate('/hr/shifts' as any)} 
            />
            <GridItem 
              icon="laptop" 
              title="Tài sản" 
              color="#64748B" 
              onPress={() => router.navigate('/hr/assets' as any)} 
            />
            <GridItem 
              icon="message-draw" 
              title="Góp ý" 
              color="#E11D48" 
              onPress={() => router.navigate('/hr/feedbacks' as any)} 
            />
          </View>
        </View>

        {/* Tổng quan công việc HR (Stats Section) */}
        <View style={[styles.section, styles.statsSection]}>
          <Text style={styles.sectionTitle}>Tổng quan công việc HR</Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Tổng nhân sự"
              value={dashboardData?.employees?.active?.toString() || '0'}
              color="#111827"
            />
            <StatCard
              title="Đi làm hôm nay"
              value={dashboardData?.attendanceToday?.checkedIn?.toString() || '0'}
              color="#10B981"
            />
            <StatCard
              title="Đơn chờ duyệt"
              value={dashboardData?.leave?.pending?.toString() || '0'}
              color="#F59E0B"
            />
            <StatCard
              title="HĐ sắp hết"
              value={dashboardData?.contracts?.expiringSoon?.toString() || '0'}
              color="#EF4444"
            />
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
                    dueDate={(task as any).dueDate || (task as any).dueAt ? new Date((task as any).dueDate || (task as any).dueAt).toLocaleDateString('vi-VN') : ''}
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
                    dueDate={(task as any).dueDate || (task as any).dueAt ? new Date((task as any).dueDate || (task as any).dueAt).toLocaleDateString('vi-VN') : ''}
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

function GridItem({
  icon,
  title,
  color = colors?.primary || '#111827',
  badge,
  badgeColor = '#EF4444',
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  color?: string;
  badge?: number | string;
  badgeColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.gridItem} onPress={onPress}>
      <View style={styles.gridIconContainer}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

function StatCard({
  title,
  value,
  color = '#111827',
}: {
  title: string;
  value: number | string;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
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

const colors = {
  primary: '#111827',
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 120,
    backgroundColor: '#FAFAFA',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  userInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 10,
    minWidth: 0,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
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
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B5563',
  },
  userInfo: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
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
    color: appleTheme.textPrimary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: appleTheme.hint,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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
    borderWidth: 1.5,
    borderColor: '#fff',
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
  heroButton: {
    borderRadius: 24,
    marginBottom: spacing.xl,
    backgroundColor: '#FFFFFF',
    shadowColor: '#475569',
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
    borderColor: '#E2E8F0',
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
    color: '#334155',
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
  vaultAppleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  vaultAppleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaultAppleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vaultAppleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vaultAppleTitleBlock: {
    flex: 1,
  },
  vaultAppleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  vaultAppleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  vaultAppleVipBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  vaultAppleVipBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vaultAppleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  vaultAppleSubtitleBold: {
    fontWeight: '800',
    color: '#059669',
  },
  vaultAppleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vaultAppleActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  vaultAppleProgressContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  vaultAppleProgressTrack: {
    height: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  vaultAppleProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  vaultAppleProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vaultAppleProgressFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  vaultAppleProgressFooterText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  vaultAppleProgressFooterPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.lg,
  },
  utilitySection: {
    marginBottom: -6,
  },
  statsSection: {
    marginTop: 0,
    marginBottom: spacing.lg,
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
