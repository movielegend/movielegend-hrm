import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, Image } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
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
import { useUnreadNotificationCount, useUnreadChatCount } from '../../hooks/useNotifications';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { FeedbackCard } from '../feedback/components/FeedbackCard';
import { LiveClock } from '../../components/LiveClock';
import { LinearGradient } from 'expo-linear-gradient';
import { ContourHeroPattern } from './components/ContourHeroPattern';
import { useMyTasks, useTasks } from '../../hooks/useTasks';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
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
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'ACTIVITY'>('TASKS');
  const { data: unreadNotifications = 0 } = useUnreadNotificationCount();
  const { data: unreadChat = 0 } = useUnreadChatCount();
  const { data: currentAttendance } = useCurrentAttendance();
  const { data: myTasks } = useMyTasks({ limit: 10 });

  const [refreshing, setRefreshing] = useState(false);

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
    return getNextVaultMilestone(myVault, new Date());
  }, [myVault]);

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
  const myTasksUncompletedCount = myTasks?.items?.filter(t => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length || 0;

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
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 24) + 90 },
        ]}
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
                    Lv.{currentLevelNumber}
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
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/leader/chat' as any)}>
              <MaterialCommunityIcons name="chat-outline" size={24} color="#111827" />
              {unreadChat > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadChat > 99 ? '99+' : unreadChat}
                  </Text>
                </View>
              )}
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
                name={currentAttendance?.state === 'CHECKED_IN' ? 'clock-check-outline' : currentAttendance?.state === 'CHECKED_OUT' ? 'check-all' : 'clock-outline'} 
                size={18} 
                color={currentAttendance?.state === 'CHECKED_IN' ? '#059669' : '#047857'} 
              />
              <Text style={[styles.heroStatusText, currentAttendance?.state === 'CHECKED_IN' && { color: '#059669', fontWeight: '700' }]}>
                {currentAttendance?.state === 'CHECKED_IN' ? 'Đang trong ca • Chạm để Ra ca' : currentAttendance?.state === 'CHECKED_OUT' ? 'Đã hoàn thành ca làm' : 'Vào ca / Chấm công'}
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

        {/* Hub Cấp Bậc & Ví Thưởng (Thẻ gộp chung chuẩn Apple UI) */}
        <View style={styles.hubContainer}>
          <View style={styles.hubCard}>
            {/* Segment 1: Cấp Bậc Hiện Tại & Tiến Độ */}
            <Pressable
              style={styles.hubSegment}
              onPress={() => router.push('/leader/leveling' as any)}
            >
              <View style={styles.hubRow}>
                <View style={[styles.hubIconCircle, { backgroundColor: `${levelColor}15` }]}>
                  <MaterialCommunityIcons name="crown" size={20} color={levelColor} />
                </View>
                <View style={styles.hubInfoBlock}>
                  <View style={styles.hubTitleRow}>
                    <Text style={styles.hubTitle} numberOfLines={1}>
                      Level {currentLevelNumber}: {levelTitle}
                    </Text>
                    <View style={[styles.hubTag, { backgroundColor: `${levelColor}15` }]}>
                      <Text style={[styles.hubTagText, { color: levelColor }]}>Lv.{currentLevelNumber}</Text>
                    </View>
                  </View>
                  <Text style={styles.hubSubtitle}>
                    {levelProgress?.nextLevel
                      ? `Tiến độ lên Level ${levelProgress.nextLevel.levelNumber}: ${levelProgress?.overallProgressPercent || 0}%`
                      : 'Cấp bậc danh dự tối cao'}
                  </Text>
                </View>
                <View style={[styles.hubActionBtn, { backgroundColor: `${levelColor}10` }]}>
                  <Text style={[styles.hubActionText, { color: levelColor }]}>Lộ trình</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={levelColor} />
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.hubProgressTrack}>
                <View
                  style={[
                    styles.hubProgressFill,
                    {
                      width: `${Math.min(100, Math.max(4, levelProgress?.overallProgressPercent || 0))}%`,
                      backgroundColor: levelColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.hubProgressFooter}>
                <Text style={styles.hubProgressLabel}>
                  {levelProgress?.nextLevel
                    ? `Mục tiêu thăng cấp Level ${levelProgress.nextLevel.levelNumber}`
                    : 'Đã hoàn tất tiến độ cấp'}
                </Text>
                <Text style={[styles.hubProgressPercent, { color: levelColor }]}>
                  {levelProgress?.overallProgressPercent || 0}%
                </Text>
              </View>
            </Pressable>

            {/* Segment 2: Ví Thưởng Tích Lũy (Hiển thị khi mở ví) */}
            {isVaultEnabled && (
              <>
                <View style={styles.hubDivider} />
                <Pressable
                  style={styles.hubSegment}
                  onPress={() => router.push('/leader/vault' as any)}
                >
                  <View style={styles.hubRow}>
                    <View style={[styles.hubIconCircle, { backgroundColor: '#F1F5F9' }]}>
                      <MaterialCommunityIcons name="wallet-outline" size={20} color="#1E293B" />
                    </View>
                    <View style={styles.hubInfoBlock}>
                      <View style={styles.hubTitleRow}>
                        <Text style={styles.hubTitle} numberOfLines={1}>Ví Thưởng Tích Lũy</Text>
                        <View style={styles.vaultBadge}>
                          <Text style={styles.vaultBadgeText}>Đặc quyền</Text>
                        </View>
                      </View>
                      <Text style={styles.hubSubtitle}>
                        Khả dụng: <Text style={styles.hubSubtitleGreen}>{unlockedVaultPoints.toLocaleString('vi-VN')} đ</Text>
                        {totalGrantedPoints > 0 ? ` • Quỹ: ${totalGrantedPoints.toLocaleString('vi-VN')} đ` : ''}
                      </Text>
                    </View>
                    <View style={styles.vaultActionBtn}>
                      <Text style={styles.vaultActionText}>Chi tiết</Text>
                      <MaterialCommunityIcons name="chevron-right" size={14} color="#475569" />
                    </View>
                  </View>

                  {vaultMilestone ? (
                    <>
                      <View style={styles.hubProgressTrack}>
                        <View
                          style={[
                            styles.hubProgressFill,
                            {
                              width: `${Math.min(100, Math.max(4, vaultMilestone.progressPercent))}%`,
                              backgroundColor: vaultMilestone.isAllUnlocked ? '#059669' : '#2563EB',
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.hubProgressFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MaterialCommunityIcons
                            name={vaultMilestone.isAllUnlocked ? 'check-decagram' : 'timer-sand'}
                            size={12}
                            color={vaultMilestone.isAllUnlocked ? '#059669' : '#64748B'}
                          />
                          <Text style={styles.vaultCountdownLabel}>
                            {vaultMilestone.isAllUnlocked
                              ? 'Đã mở khóa tất cả đợt'
                              : `Mở ${vaultMilestone.title} (${vaultMilestone.unlockDateFormatted})`}
                          </Text>
                        </View>
                        <Text style={styles.vaultCountdownTime}>
                          {vaultMilestone.isAllUnlocked
                            ? '100% Hoàn tất'
                            : `Còn ${vaultMilestone.days} ngày ${vaultMilestone.hours}h`}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Tiện ích thường dùng (Ma trận 4 cột hiện đại) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích thường dùng</Text>
          <View style={styles.grid4Container}>
            {/* Nhóm 1: Ca làm & Công (Xanh dương hoàng gia) */}
            <GridItem4
              icon="swap-horizontal"
              title="Chấm công"
              color="#2563EB"
              bgColor="#EFF6FF"
              onPress={() => router.push('/leader/attendance' as any)}
            />
            <GridItem4
              icon="view-grid-outline"
              title="Phân ca"
              color="#2563EB"
              bgColor="#EFF6FF"
              onPress={() => router.push('/leader/shift-management' as any)}
            />
            <GridItem4
              icon="calendar-check-outline"
              title="Lịch sử công"
              color="#2563EB"
              bgColor="#EFF6FF"
              onPress={() => router.push('/leader/attendance-history' as any)}
            />

            {/* Nhóm 2: Hành chính & Đơn từ (Teal thanh lịch) */}
            <GridItem4
              icon="file-document-multiple"
              title="Duyệt đơn"
              color="#0D9488"
              bgColor="#F0FDFA"
              onPress={() => router.push('/leader/employee-requests' as any)}
            />
            <GridItem4
              icon="account-tie-outline"
              title="Nhân sự"
              color="#0D9488"
              bgColor="#F0FDFA"
              onPress={() => router.push('/leader/employees' as any)}
            />
            <GridItem4
              icon="file-document-outline"
              title="Hợp đồng"
              color="#0D9488"
              bgColor="#F0FDFA"
              onPress={() => router.push('/leader/contracts' as any)}
            />
            <GridItem4
              icon="folder-text-outline"
              title="Tài liệu"
              color="#0D9488"
              bgColor="#F0FDFA"
              onPress={() => router.push('/leader/documents' as any)}
            />

            {/* Nhóm 3: Cấp bậc, Dự án & Quỹ thưởng (Indigo sang trọng) */}
            <GridItem4
              icon="clipboard-account-outline"
              title="Việc của tôi"
              color="#4F46E5"
              bgColor="#EEF2FF"
              badge={myTasksUncompletedCount > 0 ? `${myTasksUncompletedCount}` : undefined}
              badgeColor="#EF4444"
              onPress={() => router.push('/leader/my-tasks' as any)}
            />
            <GridItem4
              icon="format-list-checks"
              title="Giao việc"
              color="#4F46E5"
              bgColor="#EEF2FF"
              onPress={() => router.push('/leader/tasks' as any)}
            />
            <GridItem4
              icon="briefcase-outline"
              title="Dự án"
              color="#4F46E5"
              bgColor="#EEF2FF"
              onPress={() => router.push('/leader/level-projects' as any)}
            />
            <GridItem4
              icon="star-circle-outline"
              title="Cấp bậc"
              color="#4F46E5"
              bgColor="#EEF2FF"
              onPress={() => router.push('/leader/leveling' as any)}
            />
            <GridItem4
              icon="gift-outline"
              title="Ví Thưởng"
              color="#4F46E5"
              bgColor="#EEF2FF"
              badge={isVaultEnabled ? 'VÍ' : undefined}
              badgeColor="#4F46E5"
              onPress={() => router.push('/leader/vault' as any)}
            />
            {isAccountantLeader && (
              <GridItem4
                icon="cash-check"
                title="Chi trả"
                color="#4F46E5"
                bgColor="#EEF2FF"
                badge={pendingAccCount > 0 ? `${pendingAccCount}` : undefined}
                badgeColor="#EF4444"
                onPress={() => router.push('/leader/disbursement' as any)}
              />
            )}

            {/* Nhóm 4: Hỗ trợ & Trí tuệ nhân tạo (Executive Slate & Dark) */}
            <GridItem4
              icon="robot-outline"
              title="Trợ lý AI"
              color="#FFFFFF"
              bgColor="#0F172A"
              badge="AI"
              badgeColor="#2563EB"
              onPress={() => router.push('/leader/ai-chat' as any)}
            />
            <GridItem4
              icon="laptop"
              title="Tài sản"
              color="#64748B"
              bgColor="#F8FAFC"
              onPress={() => router.push('/leader/assets' as any)}
            />
            <GridItem4
              icon="message-draw"
              title="Góp ý"
              color="#64748B"
              bgColor="#F8FAFC"
              onPress={() => router.push('/leader/feedbacks' as any)}
            />
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
                    dueDate={task.dueAt || (task as any).dueDate ? new Date(task.dueAt || (task as any).dueDate).toLocaleDateString('vi-VN') : ''}
                    onPress={() => router.push(`/leader/my-tasks/${task.id}` as any)}
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
                    dueDate={task.dueAt || (task as any).dueDate ? new Date(task.dueAt || (task as any).dueDate).toLocaleDateString('vi-VN') : ''}
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
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom, 16) + 72 },
        ]}
        onPress={() => router.push('/leader/ai-chat' as any)}
      >
        <MaterialCommunityIcons name="robot-outline" size={26} color="#FFFFFF" />
      </Pressable>
    </Screen>
  );
}

const GridItem4 = React.memo(function GridItem4({
  icon,
  title,
  onPress,
  color,
  bgColor,
  badge,
  badgeColor,
}: any) {
  return (
    <Pressable
      style={({ pressed }) => [styles.grid4Item, pressed && styles.grid4ItemPressed]}
      onPress={onPress}
    >
      <View style={[styles.grid4IconContainer, bgColor ? { backgroundColor: bgColor } : undefined]}>
        <MaterialCommunityIcons name={icon} size={23} color={color || '#1E293B'} />
        {badge && (
          <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : undefined]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.grid4Title} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
});

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
  grid4Container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  grid4Item: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  grid4ItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  grid4IconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  grid4Title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
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
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
  // Hub Cấp Bậc & Ví Thưởng
  hubContainer: {
    marginBottom: spacing.xl,
  },
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  hubSegment: {
    paddingVertical: 4,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubInfoBlock: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  hubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  hubTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  hubTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hubSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  hubSubtitleGreen: {
    fontWeight: '800',
    color: '#059669',
  },
  hubActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hubActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hubProgressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 6,
  },
  hubProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  hubProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubProgressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  hubProgressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  hubDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  vaultBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  vaultBadgeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  vaultActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vaultActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  vaultCountdownLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  vaultCountdownTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
});
