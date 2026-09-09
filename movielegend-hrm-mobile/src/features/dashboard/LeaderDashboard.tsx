import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, Image } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getDashboardByRole, getLeaderActivities } from '../../api/dashboard.api';
import { getMyVault, getVaultWithdrawalRequests } from '../../api/employees.api';
import { getNextVaultMilestone } from '../vault/vault-utils';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { FeedbackCard } from '../feedback/components/FeedbackCard';
import { LiveClock } from '../../components/LiveClock';
import { LinearGradient } from 'expo-linear-gradient';
import { ContourHeroPattern } from './components/ContourHeroPattern';
import { useMyTasks, useTasks } from '../../hooks/useTasks';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
import { Dimensions } from 'react-native';

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', 'LEADER'],
    queryFn: () => getDashboardByRole('LEADER'),
  });

  const { data: delegatedTasks } = useTasks({ 
    createdById: user?.id,
    limit: 10 
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
    return getNextVaultMilestone(myVault, currentTime);
  }, [myVault, currentTime]);

  const userDeptName = (user?.departmentLinks?.[0]?.department?.name || '').toLowerCase();
  const isAccountantLeader = userDeptName.includes('kế toán') || userDeptName.includes('tài chính') || user?.role?.code === 'ACCOUNTANT';

  const { data: accountantWithdrawals } = useQuery({
    queryKey: ['vault-withdrawals-accountant-badge'],
    queryFn: () => getVaultWithdrawalRequests({ status: 'PENDING_ACCOUNTANT', limit: 1 }),
    enabled: isAccountantLeader,
  });
  const pendingAccCount = accountantWithdrawals?.counts?.PENDING_ACCOUNTANT || 0;
  
  const deptStats = (dashboardData?.department as any) || { activeEmployeeCount: 0, absentToday: 0, lateToday: 0, onLeaveToday: 0, checkedInCount: 0 };
  const checkedInCount = deptStats.checkedInCount || 0;

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
    if (!name) return 'LD';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleCreateTask = () => {
    router.push('/leader/tasks/create');
  };

  return (
    <Screen backgroundColor="#FAFAFA">
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable 
              style={styles.avatarWrapper}
              onPress={() => router.push('/leader/leveling' as any)}
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
                  onPress={() => router.push('/leader/leveling' as any)}
                >
                  <MaterialCommunityIcons name="crown" size={12} color={levelColor} />
                  <Text style={[styles.levelPillText, { color: levelColor }]}>
                    Lv.{currentLevelNumber} • {levelTitle}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.userName} numberOfLines={1}>{user?.fullName || 'Quản lý'}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/leader/notifications' as any)}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              {unreadCount > 0 && <View style={styles.badgeDot} />}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/leader/chat' as any)}>
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
          <View style={styles.heroCardInner}>
            {/* Vân địa hình hữu cơ / Topographic contour ripples */}
            <ContourHeroPattern variant="green" />

            {/* Top Status Header */}
            <View style={styles.heroHeaderRow}>
              <MaterialCommunityIcons 
                name={currentAttendance?.state === 'CHECKED_IN' ? 'check-circle' : 'check-circle'} 
                size={18} 
                color="#059669" 
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
          onPress={() => router.push('/leader/leveling' as any)}
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

        {/* Banner Ví Thưởng & Vạch thời gian đếm ngược đến hạn rút (Hiển thị nổi bật khi Leader được mở quyền) */}
        {isVaultEnabled && (
          <Pressable
            style={styles.vaultAppleCard}
            onPress={() => router.push('/leader/vault' as any)}
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

        {/* Tiện ích (Leader Features) */}
        <View style={[styles.section, styles.utilitySection]}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.gridContainer}>
            <GridItem icon="star-circle-outline" title="Cấp của bạn" color="#F59E0B" onPress={() => router.push('/leader/leveling' as any)} />
            <GridItem icon="briefcase-outline" title="Dự án" color="#3B82F6" onPress={() => router.push('/leader/level-projects' as any)} />
            <GridItem
              icon="gift-outline"
              title="Ví Thưởng"
              color="#059669"
              badge={isVaultEnabled ? 'VÍ' : undefined}
              badgeColor="#D97706"
              onPress={() => router.push('/leader/vault' as any)}
            />
            {isAccountantLeader && (
              <GridItem
                icon="cash-check"
                title="Chi trả thưởng"
                color="#059669"
                badge={pendingAccCount > 0 ? `${pendingAccCount}` : undefined}
                badgeColor="#EF4444"
                onPress={() => router.push('/leader/disbursement' as any)}
              />
            )}
            <GridItem icon="clipboard-check-outline" title="Duyệt level" color="#8B5CF6" onPress={() => router.push('/employee/competition/review' as any)} />
            <GridItem icon="file-document-multiple" title="Duyệt đơn" color="#EA580C" onPress={() => router.push('/leader/(tabs)/approvals' as any)} />
            <GridItem icon="file-document-edit-outline" title="Đơn của tôi" color="#0284C7" onPress={() => router.push('/employee/requests' as any)} />
            <GridItem icon="calendar-clock" title="Lịch sử công" color="#6366F1" onPress={() => router.push('/leader/attendance-history' as any)} />
            <GridItem icon="swap-horizontal" title="Chấm công" color="#2563EB" onPress={() => router.push('/leader/attendance' as any)} />
            <GridItem icon="view-grid-outline" title="Phân ca" color="#EC4899" onPress={() => router.push('/leader/shift-management' as any)} />
            <GridItem icon="account-tie-outline" title="Nhân sự" color="#10B981" onPress={() => router.push('/leader/employees' as any)} />
            <GridItem icon="file-document-outline" title="Hợp đồng" color="#0D9488" onPress={() => router.push('/leader/contracts' as any)} />
            <GridItem icon="laptop" title="Tài sản" color="#64748B" onPress={() => router.push('/leader/assets' as any)} />
            <GridItem icon="message-draw" title="Góp ý" color="#E11D48" onPress={() => router.push('/leader/feedbacks' as any)} />
          </View>
        </View>

        {/* Tổng quan nhóm hôm nay (Team Stats) */}
        <View style={[styles.section, styles.statsSection]}>
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
        onPress={() => router.push('/leader/ai-chat' as any)}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  greetingInfo: {
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
    color: '#111827',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
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
    borderWidth: 1,
    borderColor: '#fff',
  },
  heroCard: {
    borderRadius: 24,
    marginBottom: spacing.xl,
    backgroundColor: '#FFFFFF',
    shadowColor: '#059669',
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
    borderColor: '#DCFCE7',
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
    color: '#065F46',
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
    marginBottom: -6,
  },
  statsSection: {
    marginTop: 0,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: 13,
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
  vaultAppleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: spacing.xl,
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
});
