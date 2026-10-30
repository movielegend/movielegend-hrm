import { useRouter } from 'expo-router';
import React, { useState, useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Image,
  Dimensions,
  LayoutAnimation,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { useUnreadNotificationCount, useUnreadChatCount } from '../../hooks/useNotifications';
import { useAttendanceDashboardStats, useCurrentAttendance } from '../../hooks/useAttendance';
import { getVaultWithdrawalRequests, getMyVault } from '../../api/employees.api';
import { getEmployeeRequests } from '../../api/employee-requests.api';
import { useNewsfeedPosts } from '../../hooks/useNewsfeed';
import { useFeedbacksForManagement } from '../../hooks/useFeedback';
import { FeedbackStatusBadge } from '../feedback/components/FeedbackStatusBadge';
import { useMyTasks } from '../../hooks/useTasks';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Lucide Icons
import {
  MapPin,
  ChevronRight,
  Clock,
  LayoutGrid,
  MessageSquare,
  Receipt,
  ChevronDown,
  ChevronUp,
  Plus,
  Crown,
  Coins,
} from 'lucide-react-native';

import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';

import { usePinnedApps } from '../../hooks/usePinnedApps';
import { getAppRoute, getAppTitle } from '../../constants/app-registry';
import { isAccountingLeader } from '../../utils/role-routing';
import { AllServicesModal, renderAppIcon } from './components/AllServicesModal';
import { DashboardNewsCarousel } from './components/DashboardNewsCarousel';
import { LiveClockText } from '../../components/common/LiveClockText';
import { useTabBarScroll } from '../../components/navigation/tabBarVisibility';
import { useBranches } from '../../api/branches.api';
import { SelectModal, type SelectOption } from '../../components/SelectModal';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AccountantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const tabBarScroll = useTabBarScroll();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [showAllServicesModal, setShowAllServicesModal] = useState(false);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);

  // Role detection
  const isChiefAccountant = isAccountingLeader(user);
  const dashboardRole: 'ADMIN' | 'LEADER' | 'EMPLOYEE' | 'HR' = 'HR';

  // Branches System
  const branchesQuery = useBranches();
  const branches = useMemo(() => branchesQuery.data || [], [branchesQuery.data]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);

  React.useEffect(() => {
    SecureStore.getItemAsync('HR_ACTIVE_BRANCH_ID')
      .then((savedId) => {
        if (savedId) {
          setSelectedBranchId(savedId);
        }
      })
      .catch(() => {});
  }, []);

  const activeBranch = useMemo(() => {
    if (selectedBranchId) {
      const found = branches.find((b) => b.id === selectedBranchId);
      if (found) return found;
    }
    if ((user?.department as any)?.branch) return (user?.department as any).branch;
    const hanoi = branches.find((b) => b.name?.includes('HÀ NỘI') || b.name?.includes('Hà Nội'));
    return hanoi || branches[0] || null;
  }, [branches, selectedBranchId, user?.department]);

  const branchOptions: SelectOption[] = useMemo(() => {
    return branches.map((b) => ({
      label: b.name,
      value: b.id,
      subtitle: b.address,
    }));
  }, [branches]);

  const handleSelectBranch = (option: SelectOption) => {
    const val = option.value ? String(option.value) : null;
    setSelectedBranchId(val);
    if (val) {
      SecureStore.setItemAsync('HR_ACTIVE_BRANCH_ID', val).catch(() => {});
    }
  };

  // Pinned Apps System
  const { row1Apps, extraPinnedApps } = usePinnedApps('HR');

  const handleToggleQuickExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsQuickExpanded((prev) => !prev);
  }, []);

  // Notifications & Chats
  const { data: unreadNotifications = 0 } = useUnreadNotificationCount();
  const { data: unreadChat = 0 } = useUnreadChatCount();

  // Attendance
  const currentDateStr = new Date().toISOString().split('T')[0];
  const { data: attStats } = useAttendanceDashboardStats({ fromDate: currentDateStr, toDate: currentDateStr });
  const { data: currentAttendance } = useCurrentAttendance();

  // Financial Requests (Duyệt tài chính cho Kế toán)
  const { data: allFinancialRequests = [] } = useQuery({
    queryKey: ['financial-employee-requests'],
    queryFn: () => getEmployeeRequests(),
  });

  const pendingFinancialCount = useMemo(() => {
    return (allFinancialRequests || []).filter(
      (r: any) =>
        ['EXPENSE', 'PURCHASE', 'ADVANCE'].includes(r.type) &&
        ['PENDING', 'PENDING_HR_MANAGER', 'PENDING_LEADER'].includes(r.status)
    ).length;
  }, [allFinancialRequests]);

  // Due Tasks (Công việc của tôi)
  const { data: myTasks } = useMyTasks({ limit: 50 });
  const dueTasksCount = useMemo(() => {
    const list = myTasks?.items || [];
    return list.filter((t: any) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length;
  }, [myTasks]);

  // Level Progress
  const { data: levelProgress } = useQuery({
    queryKey: ['my-level-progress', user?.id],
    queryFn: () => levelingApi.getMyLevelProgress().catch(() => null),
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5,
  });

  const currentLevelNumber =
    levelProgress?.currentLevel?.levelNumber ||
    (user as any)?.currentLevelNumber ||
    (user as any)?.profile?.currentLevelNumber ||
    1;
  const levelColor =
    levelProgress?.currentLevel?.colorHex ||
    LEVEL_COLORS[currentLevelNumber] ||
    '#059669';
  const levelTitle =
    levelProgress?.currentLevel?.displayName ||
    levelProgress?.currentLevel?.badgeTitle ||
    LEVEL_DEFAULT_NAMES[currentLevelNumber] ||
    `Cấp ${currentLevelNumber}`;

  // My Vault (Ví Thưởng Tích Lũy)
  const { data: myVault } = useQuery({
    queryKey: ['my-vault', user?.id],
    queryFn: () => getMyVault().catch(() => null),
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5,
  });

  const isVaultEnabled = Boolean(myVault?.isVaultEnabled || (user as any)?.isRewardVaultEnabled);
  const rawUnlocked = myVault?.stats?.unlockedPoints || 0;
  const rate = myVault?.stats?.cashValuePerPoint || 1000;
  const unlockedVaultPoints = rawUnlocked > 100000 ? rawUnlocked : rawUnlocked * rate;
  const rawGranted = myVault?.stats?.totalGrantedPoints || 0;
  const totalGrantedPoints = rawGranted > 100000 ? rawGranted : rawGranted * rate;

  // Newsfeed (Top 5 bài viết)
  const { data: newsPosts = [] } = useNewsfeedPosts();

  // Feedbacks
  const { data: adminFeedbacksData } = useFeedbacksForManagement({ limit: 5 });
  const latestFeedback = useMemo(() => {
    const list = Array.isArray(adminFeedbacksData)
      ? adminFeedbacksData
      : (adminFeedbacksData as any)?.items || [];
    return list.length > 0 ? list[0] : null;
  }, [adminFeedbacksData]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['financial-employee-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['current-attendance'] }),
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] }),
      queryClient.invalidateQueries({ queryKey: ['feedbacks-management'] }),
      queryClient.invalidateQueries({ queryKey: ['my-level-progress'] }),
      queryClient.invalidateQueries({ queryKey: ['my-vault'] }),
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] }),
      queryClient.invalidateQueries({ queryKey: ['unread-chat-count'] }),
    ]).catch(() => {});
    setRefreshing(false);
  }, [queryClient]);

  // Navigation handlers
  const handleAttendanceAction = () => {
    router.push('/employee/attendance/check-in' as any);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'KT';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      const first = words[0];
      const last = words[words.length - 1];
      return `${first ? first[0] : ''}${last ? last[0] : ''}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formattedTodayDate = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  const dueTaskCount = dueTasksCount;

  return (
    <Screen
      backgroundColor="#F8FAFC"
      edges={['left', 'right']}
      statusBarStyle="light"
      statusBarTranslucent
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={tabBarScroll.onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Top overscroll fill */}
        <View pointerEvents="none" style={styles.topOverscrollFill} />

        {/* ================= 1. HEADER (#102739 - Matching HR & People Exactly) ================= */}
        <View style={[styles.glossyHeader, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
          <View style={styles.decorativeCurve} />

          {/* Brand Identity: movielegend PEOPLE */}
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>movielegend</Text>
            <Text style={styles.brandSubtitle}>PEOPLE</Text>
          </View>

          {/* User Bar */}
          <View style={styles.userRow}>
            <View style={styles.userInfoLeft}>
              <Pressable
                style={styles.avatarContainer}
                onPress={() => router.push('/accountant/leveling' as any)}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitialsText}>{getInitials(user?.fullName)}</Text>
                )}
                <View style={[styles.avatarLevelBadge, { backgroundColor: '#059669' }]}>
                  <Text style={styles.avatarLevelBadgeText}>{currentLevelNumber}</Text>
                </View>
              </Pressable>

              <View style={styles.userTextCol}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user?.fullName || 'Kế toán viên'}
                </Text>
              </View>
            </View>

            {/* Header Right Actions */}
            <View style={styles.headerRightActions}>
              <Pressable
                style={styles.aiHeaderButton}
                onPress={() => router.push('/accountant/ai-chat' as any)}
                accessibilityLabel="Trợ lý AI"
              >
                <MaterialCommunityIcons name="creation-outline" size={24} color="#FFFFFF" />
              </Pressable>

              <Pressable
                style={styles.bellButton}
                onPress={() => router.push('/accountant/notifications' as any)}
                accessibilityLabel="Thông báo"
              >
                <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
                {unreadNotifications > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* ================= 2. HERO CARD (OVERVIEW WHITE CARD) ================= */}
        <View style={styles.heroCardWrapper}>
          <View style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroTopographicWrapper}>
              <Image
                source={require('../../../assets/topographic-contour-accountant-v2.png')}
                style={styles.heroTopographicBg}
                resizeMode="cover"
              />
            </View>

            {/* Top row inside card */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeftGroup}>
                <Pressable
                  style={[styles.adminRoleTag, { backgroundColor: '#ECFDF5' }]}
                  onPress={() => router.push('/accountant/leveling' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Xem cấp bậc"
                >
                  <Crown size={13} color="#059669" strokeWidth={2.2} />
                  <Text style={[styles.adminRoleTagText, { color: '#059669' }]} numberOfLines={1} ellipsizeMode="tail">
                    Lv.{currentLevelNumber} • {isChiefAccountant ? 'Kế toán trưởng' : 'Kế toán'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAttendanceAction}
                  style={({ pressed }) => [
                    styles.attendanceHeaderTag,
                    pressed && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Chấm công"
                >
                  <Clock size={11} color="#000000" strokeWidth={2.2} />
                  <Text style={styles.attendanceHeaderTagText}>
                    {currentAttendance?.state === 'CHECKED_IN'
                      ? 'Ra ca'
                      : currentAttendance?.state === 'CHECKED_OUT'
                      ? 'Đã xong ca'
                      : 'Vào ca'}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.cardHeaderDateText}>{formattedTodayDate}</Text>
            </View>

            {/* Big Bold Live Time */}
            <Pressable
              onPress={handleAttendanceAction}
              style={({ pressed }) => [styles.dateNumberRow, pressed && { opacity: 0.75 }]}
              accessibilityRole="button"
              accessibilityLabel="Chấm công"
            >
              <LiveClockText style={styles.bigDateNumberText} />
            </Pressable>

            {/* Bottom 2-Column Metrics Row */}
            <View style={styles.cardMetricsRow}>
              {/* Col 1: Location */}
              <View style={styles.metricColLocation}>
                <MapPin size={13} color="#000000" strokeWidth={1.8} />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  {user?.department?.branch?.name || (user?.department as any)?.branchName || activeBranch?.name || 'MOVIELEGEND-HÀ NỘI'}
                </Text>
              </View>

              {/* Col 2: Đơn tài chính */}
              <Pressable
                style={styles.metricColStatRight}
                onPress={() => router.push('/accountant/financial-requests' as any)}
              >
                <Text style={styles.metricLabelCaps} numberOfLines={1}>
                  ĐƠN TÀI CHÍNH
                </Text>
                <Text style={styles.metricNumberValue}>
                  {pendingFinancialCount}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* ================= HÀNH TRÌNH & QUỸ THƯỞNG ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Hành trình &amp; Quỹ thưởng</Text>
            </View>

            <View style={styles.hubCard}>
              {/* Cấp bậc */}
              <Pressable
                style={styles.hubSegment}
                onPress={() => router.push('/accountant/leveling' as any)}
                accessibilityRole="button"
                accessibilityLabel="Xem chi tiết cấp bậc"
              >
                <View style={styles.hubRow}>
                  <View style={[styles.hubIconCircle, { backgroundColor: `${levelColor}15` }]}>
                    <Crown size={20} color={levelColor} />
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
                        ? `Tiến độ lên Lv.${levelProgress.nextLevel.levelNumber}: ${levelProgress?.overallProgressPercent || 0}%`
                        : 'Cấp bậc danh dự tối cao'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
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
              </Pressable>

              {/* Ví Thưởng Tích Lũy */}
              <View style={styles.hubDivider} />
              <Pressable
                style={styles.hubSegment}
                onPress={() => router.push('/accountant/vault' as any)}
                accessibilityRole="button"
                accessibilityLabel="Xem ví thưởng tích lũy"
              >
                <View style={styles.hubRow}>
                  <View style={[styles.hubIconCircle, { backgroundColor: '#E7F0F7' }]}>
                    <Coins size={20} color="#102739" />
                  </View>
                  <View style={styles.hubInfoBlock}>
                    <View style={styles.hubTitleRow}>
                      <Text style={styles.hubTitle} numberOfLines={1}>Ví Thưởng Tích Lũy</Text>
                      <View style={styles.vaultBadge}>
                        <Text style={styles.vaultBadgeText}>Đặc quyền</Text>
                      </View>
                    </View>
                    <Text style={styles.hubSubtitle}>
                      {isVaultEnabled ? (
                        <>
                          Khả dụng:{' '}
                          <Text style={styles.hubSubtitleGreen}>
                            {unlockedVaultPoints.toLocaleString('vi-VN')} đ
                          </Text>
                          {totalGrantedPoints > 0 ? ` • Quỹ: ${totalGrantedPoints.toLocaleString('vi-VN')} đ` : ''}
                        </>
                      ) : (
                        'Đặc quyền phúc lợi tích lũy • Chạm để xem'
                      )}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </View>
              </Pressable>
            </View>
          </View>

          {/* ================= 3. CẦN BẠN XỬ LÝ (NGHIỆP VỤ TÀI CHÍNH) ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Cần bạn xử lý</Text>
            </View>

            {/* Item 1: Duyệt chi & Đơn tài chính */}
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push('/accountant/financial-requests' as any)}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Receipt size={22} color="#059669" strokeWidth={1.5} />
                </View>
                <View style={styles.actionCardTexts}>
                  <Text style={styles.actionCardTitle}>Duyệt chi &amp; Đơn tài chính</Text>
                  <Text style={styles.actionCardDesc}>Tạm ứng, mua sắm, hoàn ứng</Text>
                </View>
              </View>

              <View style={styles.actionCardRight}>
                <View style={styles.coralBadge}>
                  <Text style={styles.coralBadgeText}>
                    {String(pendingFinancialCount).padStart(2, '0')}
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={1.4} />
              </View>
            </Pressable>

            {/* Item 2: Công việc đến hạn */}
            <Pressable
              style={[styles.actionCard, { marginTop: 10 }]}
              onPress={() => router.push('/accountant/my-tasks' as any)}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: '#E7F0F7' }]}>
                  <Clock size={22} color="#102739" strokeWidth={1.4} />
                </View>
                <View style={styles.actionCardTexts}>
                  <Text style={styles.actionCardTitle}>Công việc đến hạn</Text>
                  <Text style={styles.actionCardDesc}>Cần hoàn thành hôm nay</Text>
                </View>
              </View>

              <View style={styles.actionCardRight}>
                <View style={styles.coralBadge}>
                  <Text style={styles.coralBadgeText}>
                    {String(dueTaskCount).padStart(2, '0')}
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={1.4} />
              </View>
            </Pressable>
          </View>

          {/* ================= 4. TRUY CẬP NHANH ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Truy cập nhanh</Text>
              <Pressable
                onPress={() => {
                  setModalEditMode(true);
                  setShowAllServicesModal(true);
                }}
              >
                <Text style={styles.customizeLink}>Tùy chỉnh</Text>
              </Pressable>
            </View>

            <View style={styles.quickGridCard}>
              {/* Row 1: 4 app đầu tiên */}
              <View style={styles.quickGrid4Row}>
                {row1Apps.map((item) => {
                  const route = getAppRoute(item, dashboardRole, user);
                  const badge =
                    item.badgeKey === 'dueTasks'
                      ? (dueTaskCount > 0 ? dueTaskCount : undefined)
                      : item.badgeKey === 'pendingFinancial'
                      ? (pendingFinancialCount > 0 ? pendingFinancialCount : undefined)
                      : undefined;

                  return (
                    <QuickGrid8Item
                      key={item.key}
                      title={getAppTitle(item, dashboardRole, user)}
                      icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                      bgColor={item.bgColor}
                      badge={badge}
                      onPress={() => {
                        if (route) router.push(route as any);
                      }}
                    />
                  );
                })}
              </View>

              {/* Row 2: các app phụ */}
              {isQuickExpanded && (
                <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                  {extraPinnedApps.map((item) => {
                    const route = getAppRoute(item, dashboardRole, user);
                    return (
                      <QuickGrid8Item
                        key={item.key}
                        title={getAppTitle(item, dashboardRole, user)}
                        icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                        bgColor={item.bgColor}
                        onPress={() => {
                          if (route) router.push(route as any);
                        }}
                      />
                    );
                  })}
                </View>
              )}

              {extraPinnedApps.length > 0 && (
                <View style={styles.expandDropdownTrigger}>
                  <Pressable
                    style={styles.expandDropdownButton}
                    onPress={handleToggleQuickExpanded}
                    android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: false }}
                  >
                    <Text style={styles.expandDropdownText}>
                      {isQuickExpanded ? 'Thu gọn' : `Xem thêm ${extraPinnedApps.length} ứng dụng`}
                    </Text>
                    {isQuickExpanded ? (
                      <ChevronUp size={16} color="#64748B" strokeWidth={2} />
                    ) : (
                      <ChevronDown size={16} color="#64748B" strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
              )}

              {/* Nút Tất cả dịch vụ */}
              <View style={styles.allServicesRow}>
                <Pressable
                  style={styles.allServicesButton}
                  onPress={() => {
                    setModalEditMode(false);
                    setShowAllServicesModal(true);
                  }}
                >
                  <LayoutGrid size={16} color="#102739" />
                  <Text style={styles.allServicesButtonText}>Tất cả tiện ích &amp; dịch vụ</Text>
                  <ChevronRight size={16} color="#102739" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ================= 5. HÒM THƯ GÓP Ý ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Hòm thư góp ý</Text>
              <Pressable onPress={() => router.push('/accountant/feedbacks' as any)}>
                <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
              </Pressable>
            </View>

            {latestFeedback ? (
              <Pressable
                style={styles.feedbackCard}
                onPress={() => router.push(`/accountant/feedbacks/${latestFeedback.id}` as any)}
              >
                <View style={styles.feedbackCardHeader}>
                  <View style={styles.feedbackLeftHeader}>
                    <View style={styles.feedbackIconCircle}>
                      <MessageSquare size={16} color="#0284C7" strokeWidth={1.4} />
                    </View>
                    <Text style={styles.feedbackTitle} numberOfLines={1}>
                      {latestFeedback.title}
                    </Text>
                  </View>
                  <FeedbackStatusBadge status={latestFeedback.status} />
                </View>

                <Text style={styles.feedbackContentSnippet} numberOfLines={2}>
                  {latestFeedback.content}
                </Text>

                <View style={styles.feedbackFooter}>
                  <Text style={styles.feedbackDateText}>
                    {latestFeedback.senderDisplayName ? `Từ: ${latestFeedback.senderDisplayName} • ` : ''}
                    {latestFeedback.createdAt ? new Date(latestFeedback.createdAt).toLocaleDateString('vi-VN') : ''}
                  </Text>
                  <View style={styles.feedbackActionRow}>
                    <Text style={styles.feedbackActionHint}>Xử lý</Text>
                    <ChevronRight size={15} color="#0284C7" strokeWidth={1.4} />
                  </View>
                </View>
              </Pressable>
            ) : (
              <View style={styles.feedbackEmptyCard}>
                <View style={styles.feedbackEmptyIconBox}>
                  <MessageSquare size={22} color="#0284C7" strokeWidth={1.4} />
                </View>
                <View style={styles.feedbackEmptyInfo}>
                  <Text style={styles.feedbackEmptyTitle}>Chưa có góp ý mới</Text>
                  <Text style={styles.feedbackEmptyDesc} numberOfLines={2}>
                    Các góp ý và đề xuất cải tiến từ nhân viên toàn công ty sẽ hiển thị tại đây.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ================= 6. BẢNG TIN NỘI BỘ ================= */}
          <DashboardNewsCarousel
            posts={newsPosts}
            role="HR"
            newsfeedRoute="/accountant/newsfeed"
          />
        </View>
      </ScrollView>

      {/* ================= MODAL: TẤT CẢ DỊCH VỤ ================= */}
      <AllServicesModal
        visible={showAllServicesModal}
        onClose={() => setShowAllServicesModal(false)}
        role={dashboardRole}
        initialEditMode={modalEditMode}
        pendingCounts={{
          dueTasks: dueTaskCount,
          pendingFinancial: pendingFinancialCount,
        }}
      />

      {/* Modal: Chọn chi nhánh */}
      <SelectModal
        visible={showBranchModal}
        title="Chi nhánh hoạt động"
        options={branchOptions}
        selectedValue={activeBranch?.id}
        onSelect={handleSelectBranch}
        onClose={() => setShowBranchModal(false)}
      />
    </Screen>
  );
}

// Sub-component: QuickGrid8Item
const QuickGrid8Item = React.memo(function QuickGrid8Item({
  title,
  icon,
  bgColor,
  badge,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  badge?: number | string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickGrid8Item, pressed && styles.quickGrid8ItemPressed]}
      onPress={onPress}
    >
      <View style={styles.quickIconWrapper}>
        <View style={[styles.quickIconBox8, { backgroundColor: bgColor }]}>
          {icon}
        </View>
        {Boolean(badge) && (
          <View style={styles.quickItemBadge}>
            <Text style={styles.quickItemBadgeText}>
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.quickLabel8} numberOfLines={2} ellipsizeMode="tail">
        {title}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  topOverscrollFill: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#102739',
  },
  glossyHeader: {
    backgroundColor: '#102739',
    paddingHorizontal: 20,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCurve: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
    letterSpacing: 2.2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarInitialsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#102739',
  },
  avatarLevelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userTextCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroCardWrapper: {
    marginTop: -16,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  heroTopographicWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.85,
  },
  heroTopographicBg: {
    width: '100%',
    height: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  adminRoleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  adminRoleTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  attendanceHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 999,
  },
  attendanceHeaderTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
  cardHeaderDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dateNumberRow: {
    marginVertical: 4,
  },
  bigDateNumberText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  cardMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricColLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  metricColStatRight: {
    alignItems: 'flex-end',
  },
  metricLabelCaps: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  metricNumberValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 18,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  customizeLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  hubSegment: {
    paddingVertical: 4,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  hubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  hubTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  hubTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hubSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  hubSubtitleGreen: {
    fontWeight: '700',
    color: '#059669',
  },
  vaultBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  vaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  hubProgressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  hubProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  hubDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTexts: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coralBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  coralBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  quickGridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickGrid4Row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickGrid8Item: {
    width: (SCREEN_WIDTH - 32 - 32) / 4,
    alignItems: 'center',
  },
  quickGrid8ItemPressed: {
    opacity: 0.7,
  },
  quickIconWrapper: {
    position: 'relative',
  },
  quickIconBox8: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickItemBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  quickItemBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickLabel8: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginTop: 6,
    textAlign: 'center',
  },
  expandDropdownTrigger: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
    alignItems: 'center',
  },
  expandDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  expandDropdownText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  allServicesRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  allServicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  allServicesButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#102739',
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  feedbackLeftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  feedbackIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  feedbackContentSnippet: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginVertical: 4,
  },
  feedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  feedbackDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  feedbackActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  feedbackActionHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  feedbackEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  feedbackEmptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackEmptyInfo: {
    flex: 1,
  },
  feedbackEmptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  feedbackEmptyDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
