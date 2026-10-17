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
import { apiClient, unwrapData } from '../../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { useUnreadNotificationCount, useUnreadChatCount } from '../../hooks/useNotifications';
import { useAttendanceDashboardStats, useCurrentAttendance } from '../../hooks/useAttendance';
import { getVaultWithdrawalRequests } from '../../api/employees.api';
import { getEmployeeRequests } from '../../api/employee-requests.api';
import { useNewsfeedPosts } from '../../hooks/useNewsfeed';
import { useFeedbacksForManagement } from '../../hooks/useFeedback';
import { FeedbackStatusBadge } from '../feedback/components/FeedbackStatusBadge';
import { useMyTasks } from '../../hooks/useTasks';
import { resolveFileUrl } from '../../utils/url';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Lucide Icons (Exact modern outline stroke matching Admin Dashboard)
import {
  Bell,
  MapPin,
  FileText,
  ChevronRight,
  Clock,
  LayoutGrid,
  Newspaper,
  ShieldCheck,
  MessageSquare,
  Receipt,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Crown,
} from 'lucide-react-native';

import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';

import { usePinnedApps } from '../../hooks/usePinnedApps';
import { getAppRoute, getAppTitle } from '../../constants/app-registry';
import { AllServicesModal, renderAppIcon } from './components/AllServicesModal';
import { LiveClockText } from '../../components/common/LiveClockText';
import { useTabBarScroll } from '../../components/navigation/tabBarVisibility';
import { useBranches } from '../../api/branches.api';
import { SelectModal, type SelectOption } from '../../components/SelectModal';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HRDashboard() {
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
  const isAccountant = Boolean(
    user?.roles?.some((r: any) => {
      const code = String(typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase();
      return code.includes('ACCOUNTANT') || code === 'KT' || code === 'KETOAN';
    }) ||
    user?.position?.name?.toLowerCase().includes('kế toán') ||
    user?.department?.name?.toLowerCase().includes('kế toán')
  );
  const isHr = Boolean(user?.roles?.some((r: any) => {
    const code = String(typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase();
    return code === 'HR' || code.includes('HR_');
  }));
  const isAdmin = Boolean(user?.roles?.some((r: any) => {
    const code = String(typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase();
    return code === 'ADMIN' || code === 'SUPER_ADMIN';
  }));
  const isOnlyAccountant = isAccountant && !isHr && !isAdmin;

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

  // Pinned Apps System (1 dòng 4 app ban đầu, dropdown mở rộng app phụ + Tất cả)
  const { row1Apps, extraPinnedApps } = usePinnedApps('HR');

  const handleToggleQuickExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsQuickExpanded(prev => !prev);
  }, []);

  // Notifications & Chats
  const { data: unreadNotifications = 0 } = useUnreadNotificationCount();
  const { data: unreadChat = 0 } = useUnreadChatCount();

  // Dashboard API Stats
  const { data: dashboardData } = useQuery({
    queryKey: ['hr-dashboard-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/admin');
      return unwrapData(response) as any;
    },
  });

  // Attendance Stats
  const currentDateStr = new Date().toISOString().split('T')[0];
  const { data: attStats } = useAttendanceDashboardStats({ fromDate: currentDateStr, toDate: currentDateStr });
  const { data: currentAttendance } = useCurrentAttendance();

  // Pending Employee Requests (for "Đơn chờ duyệt")
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['hr-pending-requests-count'],
    queryFn: async () => {
      try {
        const res = await getEmployeeRequests({ status: 'PENDING' });
        const list = Array.isArray(res) ? res : [];
        return list.filter((r: any) => r.status === 'PENDING');
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 30,
  });

  // Financial Requests (for Kế toán / Duyệt tài chính)
  const { data: allFinancialRequests = [] } = useQuery({
    queryKey: ['financial-employee-requests'],
    queryFn: () => getEmployeeRequests(),
    enabled: Boolean(isAccountant || isAdmin),
  });

  const pendingFinancialCount = useMemo(() => {
    return (allFinancialRequests || []).filter(
      (r: any) =>
        ['EXPENSE', 'PURCHASE', 'ADVANCE'].includes(r.type) &&
        ['PENDING', 'PENDING_HR_MANAGER', 'PENDING_LEADER'].includes(r.status)
    ).length;
  }, [allFinancialRequests]);

  // Due Tasks (for "Công việc đến hạn")
  const { data: myTasks } = useMyTasks({ limit: 20 });
  const dueTasksCount = useMemo(() => {
    const list = myTasks?.items || [];
    return list.filter((t: any) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length;
  }, [myTasks]);

  // Feedbacks (for "Hòm thư góp ý")
  const { data: adminFeedbacksData } = useFeedbacksForManagement({ limit: 5 });
  const latestFeedback = useMemo(() => {
    const list = Array.isArray(adminFeedbacksData)
      ? adminFeedbacksData
      : (adminFeedbacksData as any)?.items || [];
    return list.length > 0 ? list[0] : null;
  }, [adminFeedbacksData]);

  // Newsfeed (for "Bảng tin nội bộ")
  const { data: newsPosts = [] } = useNewsfeedPosts();
  const latestPost = useMemo(() => {
    const list = Array.isArray(newsPosts) ? newsPosts : (newsPosts as any)?.items || [];
    return list.length > 0 ? list[0] : null;
  }, [newsPosts]);

  // Vault count
  const { data: withdrawalData } = useQuery({
    queryKey: ['hr-pending-withdrawals-count'],
    queryFn: () => getVaultWithdrawalRequests({ limit: 1 }),
    staleTime: 1000 * 30,
  });
  const pendingAdminVaultCount =
    (withdrawalData as any)?.counts?.PENDING_ADMIN ??
    (withdrawalData as any)?.meta?.pendingAdminCount ??
    0;

  // Level Progress cho HR & Kế toán
  const { data: levelProgress } = useQuery({
    queryKey: ['my-level-progress', user?.id],
    queryFn: () => levelingApi.getMyLevelProgress().catch(() => null),
    enabled: Boolean(user?.id),
  });

  const currentLevelNumber = levelProgress?.currentLevel?.levelNumber || (user as any)?.currentLevel || 1;
  const levelColor = levelProgress?.currentLevel?.colorHex || LEVEL_COLORS[currentLevelNumber] || '#2563EB';
  const levelTitle =
    levelProgress?.currentLevel?.displayName ||
    levelProgress?.currentLevel?.badgeTitle ||
    LEVEL_DEFAULT_NAMES[currentLevelNumber] ||
    `Cấp ${currentLevelNumber}`;

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  // Attendance Check-in / Check-out quick action
  const handleAttendanceAction = useCallback(() => {
    if (currentAttendance?.state === 'CHECKED_IN') {
      router.push('/hr/attendance/check-out' as any);
    } else {
      router.push('/hr/attendance/check-in' as any);
    }
  }, [currentAttendance?.state, router]);

  // Greeting by hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'CHÀO BUỔI SÁNG,';
    if (hour < 18) return 'CHÀO BUỔI CHIỀU,';
    return 'CHÀO BUỔI TỐI,';
  };

  // Avatar Initials
  const getInitials = (name?: string) => {
    if (!name) return isOnlyAccountant ? 'KT' : 'HR';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      const first = words[0]?.charAt(0) || '';
      const last = words[words.length - 1]?.charAt(0) || '';
      return `${first}${last}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Formatted date (DD.MM.YYYY e.g. 12.10.2026 đặt vào góc phải thay cho lời chào)
  const formattedTodayDate = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  const pendingRequestCount = pendingRequests.length;
  const dueTaskCount = dueTasksCount;
  const openTasks = dueTasksCount > 0 ? dueTasksCount : (dashboardData?.tasks?.totalActive ?? 0);

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
        {/* Top overscroll guard: màu xanh khớp đỉnh header khi kéo xuống */}
        <View pointerEvents="none" style={styles.topOverscrollFill} />

        {/* ================= 1. HEADER (#102739 - Matching Profile & Admin Screen) ================= */}
        <View style={[styles.glossyHeader, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
          {/* Subtle Decorative Wave Curve Background - Matching Profile */}
          <View style={styles.decorativeCurve} />

          {/* Brand Identity: movielegend PEOPLE */}
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>movielegend</Text>
            <Text style={styles.brandSubtitle}>PEOPLE</Text>
          </View>

          {/* User Bar with Glossy Glass Bell */}
          <View style={styles.userRow}>
            <View style={styles.userInfoLeft}>
              {/* Avatar circle */}
              <Pressable
                style={styles.avatarContainer}
                onPress={() => router.push('/hr/leveling' as any)}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitialsText}>{getInitials(user?.fullName)}</Text>
                )}
                <View style={[styles.avatarLevelBadge, { backgroundColor: levelColor }]}>
                  <Text style={styles.avatarLevelBadgeText}>{currentLevelNumber}</Text>
                </View>
              </Pressable>

              {/* Greeting & Name */}
              <View style={styles.userTextCol}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user?.fullName || (isOnlyAccountant ? 'Nguyễn Văn Kế Toán' : 'HR Movie Legend')}
                </Text>
              </View>
            </View>

            {/* Header Right Actions: AI Assistant & Notification Bell */}
            <View style={styles.headerRightActions}>
              <Pressable
                style={styles.aiHeaderButton}
                onPress={() => router.push('/hr/ai-chat' as any)}
                accessibilityLabel="Trợ lý AI"
              >
                <MaterialCommunityIcons name="creation-outline" size={24} color="#FFFFFF" />
              </Pressable>

              <Pressable
                style={styles.bellButton}
                onPress={() => router.push('/hr/notifications' as any)}
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

        {/* ================= 2. HERO CARD (OVERVIEW WHITE CARD CÓ RIPPLE) ================= */}
        <View style={styles.heroCardWrapper}>
          <View style={styles.heroCard}>
            {/* Vân địa hình hữu cơ / Topographic contour ripples */}
            <View pointerEvents="none" style={styles.heroTopographicWrapper}>
              <Image
                source={
                  isOnlyAccountant
                    ? require('../../../assets/topographic-contour-accountant-v2.png')
                    : require('../../../assets/topographic-contour-hr-v2.png')
                }
                style={styles.heroTopographicBg}
                resizeMode="cover"
              />
            </View>

            {/* Top row inside card: Role Tag + Attendance Tag + Ngày hôm nay */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeftGroup}>
                <Pressable
                  style={[
                    styles.adminRoleTag,
                    isOnlyAccountant
                      ? { backgroundColor: '#ECFDF5' }
                      : { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
                  ]}
                  onPress={() => router.push('/hr/leveling' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Xem cấp bậc"
                >
                  {isOnlyAccountant ? (
                    <>
                      <Crown size={13} color="#059669" strokeWidth={2.2} />
                      <Text style={[styles.adminRoleTagText, { color: '#059669' }]} numberOfLines={1} ellipsizeMode="tail">
                        Lv.{currentLevelNumber} • Kế toán
                      </Text>
                    </>
                  ) : (
                    <>
                      <Crown size={13} color="#475569" strokeWidth={2.2} />
                      <Text style={[styles.adminRoleTagText, { color: '#334155' }]} numberOfLines={1} ellipsizeMode="tail">
                        Lv.{currentLevelNumber} • Nhân sự
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* Chữ ra ca / vào ca - nhẹ nhàng, không viền, chữ màu đen */}
                <Pressable
                  onPress={handleAttendanceAction}
                  style={({ pressed }) => [
                    styles.attendanceHeaderTag,
                    pressed && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Chấm công"
                >
                  <Clock
                    size={11}
                    color="#000000"
                    strokeWidth={2.2}
                  />
                  <Text style={styles.attendanceHeaderTagText}>
                    {currentAttendance?.state === 'CHECKED_IN'
                      ? 'Ra ca'
                      : currentAttendance?.state === 'CHECKED_OUT'
                      ? 'Đã xong ca'
                      : 'Vào ca'}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.cardHeaderDateText}>
                {formattedTodayDate}
              </Text>
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
              {/* Col 1: Location (Cố định theo cơ sở) */}
              <View style={styles.metricColLocation}>
                <MapPin size={13} color="#000000" strokeWidth={1.8} />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  {user?.department?.branch?.name || (user?.department as any)?.branchName || activeBranch?.name || 'MOVIELEGEND-HÀ NỘI'}
                </Text>
              </View>

              {/* Col 2: Metric on right (Đơn tài chính hoặc Công việc mở) */}
              <Pressable
                style={styles.metricColStatRight}
                onPress={() => {
                  if (isOnlyAccountant) {
                    router.push('/hr/financial-requests' as any);
                  } else {
                    router.push('/hr/tasks' as any);
                  }
                }}
              >
                <Text style={styles.metricLabelCaps} numberOfLines={1}>
                  {isOnlyAccountant ? 'ĐƠN TÀI CHÍNH' : 'CÔNG VIỆC MỞ'}
                </Text>
                <Text style={styles.metricNumberValue}>
                  {isOnlyAccountant ? pendingFinancialCount : openTasks}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* ================= 3. CẦN BẠN XỬ LÝ ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Cần bạn xử lý</Text>
            </View>

            {/* Item 1: Đơn tài chính (Accountant) hoặc Đơn chờ duyệt (HR) */}
            {isOnlyAccountant ? (
              <Pressable
                style={styles.actionCard}
                onPress={() => router.push('/hr/financial-requests' as any)}
              >
                <View style={styles.actionCardLeft}>
                  <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Receipt size={22} color="#059669" strokeWidth={1.5} />
                  </View>
                  <View style={styles.actionCardTexts}>
                    <Text style={styles.actionCardTitle}>Duyệt chi & Đơn tài chính</Text>
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
            ) : (
              <Pressable
                style={styles.actionCard}
                onPress={() => router.push('/hr/employee-requests' as any)}
              >
                <View style={styles.actionCardLeft}>
                  <View style={[styles.actionIconBox, { backgroundColor: '#E7F0F7' }]}>
                    <FileText size={22} color="#102739" strokeWidth={1.4} />
                  </View>
                  <View style={styles.actionCardTexts}>
                    <Text style={styles.actionCardTitle}>Đơn chờ duyệt</Text>
                    <Text style={styles.actionCardDesc}>Nghỉ phép, tăng ca</Text>
                  </View>
                </View>

                <View style={styles.actionCardRight}>
                  <View style={styles.coralBadge}>
                    <Text style={styles.coralBadgeText}>
                      {String(pendingRequestCount).padStart(2, '0')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={1.4} />
                </View>
              </Pressable>
            )}

            {/* Item 2: Công việc đến hạn */}
            <Pressable
              style={[styles.actionCard, { marginTop: 10 }]}
              onPress={() => router.push('/hr/my-tasks' as any)}
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

          {/* ================= 4. TRUY CẬP NHANH (BOX TRẮNG CÓ NÚT ĐẨY XUỐNG) ================= */}
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

            {/* Box trắng bo góc chứa 1 dòng 4 icons và dropdown mở rộng khi bấm nút mũi tên */}
            <View style={styles.quickAccessBox}>
              {/* Row 1: 4 app đầu tiên luôn hiển thị trên 1 dòng */}
              <View style={styles.quickGrid4Row}>
                {row1Apps.map((item) => {
                  const route = getAppRoute(item, 'HR');
                  const badge =
                    item.badgeKey === 'pendingRequests'
                      ? (pendingRequestCount > 0 ? pendingRequestCount : undefined)
                      : item.badgeKey === 'dueTasks'
                      ? (dueTaskCount > 0 ? dueTaskCount : undefined)
                      : item.badgeKey === 'pendingFinancial'
                      ? (pendingFinancialCount > 0 ? pendingFinancialCount : undefined)
                      : undefined;

                  return (
                    <QuickGrid8Item
                      key={item.key}
                      title={getAppTitle(item, 'HR')}
                      bgColor={item.bgColor}
                      badge={badge}
                      icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                      onPress={() => {
                        if (route) router.push(route as any);
                      }}
                    />
                  );
                })}
              </View>

              {/* Dropdown Rows: Hiển thị khi bấm nút mũi tên xuống */}
              {isQuickExpanded && (
                <View style={styles.extraRowsContainer}>
                  {extraPinnedApps.length <= 3 ? (
                    /* Hàng 2: các app phụ + nút Thêm + ô trống + nút Tất cả ở ô thứ 4 */
                    <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                      {extraPinnedApps.map((item) => {
                        const route = getAppRoute(item, 'HR');
                        return (
                          <QuickGrid8Item
                            key={item.key}
                            title={getAppTitle(item, 'HR')}
                            bgColor={item.bgColor}
                            icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                            onPress={() => {
                              if (route) router.push(route as any);
                            }}
                          />
                        );
                      })}

                      {/* Nút Thêm lối tắt nếu chưa đủ 3 app phụ */}
                      <Pressable
                        style={({ pressed }) => [styles.quickGrid8Item, pressed && styles.quickGrid8ItemPressed]}
                        onPress={() => {
                          setModalEditMode(true);
                          setShowAllServicesModal(true);
                        }}
                      >
                        <View style={[styles.quickIconBox8, styles.quickIconBoxAdd]}>
                          <Plus size={22} color="#94A3B8" strokeWidth={1.4} />
                        </View>
                        <Text style={[styles.quickGrid8Label, { color: '#64748B' }]} numberOfLines={1}>
                          Thêm
                        </Text>
                      </Pressable>

                      {/* Ô trống để căn đều 4 cột */}
                      {Array.from({ length: Math.max(0, 2 - extraPinnedApps.length) }).map((_, emptyIdx) => (
                        <View key={`empty-${emptyIdx}`} style={styles.quickGrid8Item} />
                      ))}

                      {/* Ô thứ 4 luôn là "Tất cả" */}
                      <QuickGrid8Item
                        title="Tất cả"
                        bgColor="#F1F5F9"
                        icon={<LayoutGrid size={22} color="#475569" strokeWidth={1.4} />}
                        onPress={() => {
                          setModalEditMode(false);
                          setShowAllServicesModal(true);
                        }}
                      />
                    </View>
                  ) : (
                    /* Khi có từ 4 app phụ trở lên */
                    <>
                      {/* Hàng 2: 4 app phụ đầu tiên */}
                      <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                        {extraPinnedApps.slice(0, 4).map((item) => {
                          const route = getAppRoute(item, 'HR');
                          return (
                            <QuickGrid8Item
                              key={item.key}
                              title={getAppTitle(item, 'HR')}
                              bgColor={item.bgColor}
                              icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                              onPress={() => {
                                if (route) router.push(route as any);
                              }}
                            />
                          );
                        })}
                      </View>

                      {/* Hàng 3: app phụ còn lại + Thêm (nếu còn chỗ) + Tất cả */}
                      {extraPinnedApps.slice(4).length <= 2 && (
                        <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                          {extraPinnedApps.slice(4).map((item) => {
                            const route = getAppRoute(item, 'HR');
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={getAppTitle(item, 'HR')}
                                bgColor={item.bgColor}
                                icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                                onPress={() => {
                                  if (route) router.push(route as any);
                                }}
                              />
                            );
                          })}
                          <Pressable
                            style={({ pressed }) => [styles.quickGrid8Item, pressed && styles.quickGrid8ItemPressed]}
                            onPress={() => { setModalEditMode(true); setShowAllServicesModal(true); }}
                          >
                            <View style={[styles.quickIconBox8, styles.quickIconBoxAdd]}>
                              <Plus size={22} color="#94A3B8" strokeWidth={1.4} />
                            </View>
                            <Text style={[styles.quickGrid8Label, { color: '#64748B' }]} numberOfLines={1}>Thêm</Text>
                          </Pressable>
                          {Array.from({ length: Math.max(0, 2 - extraPinnedApps.slice(4).length) }).map((_, i) => (
                            <View key={`empty-r3-${i}`} style={styles.quickGrid8Item} />
                          ))}
                          <QuickGrid8Item
                            title="Tất cả" bgColor="#E7F0F7"
                            icon={<LayoutGrid size={22} color="#102739" strokeWidth={1.4} />}
                            onPress={() => { setModalEditMode(false); setShowAllServicesModal(true); }}
                          />
                        </View>
                      )}
                      {extraPinnedApps.slice(4).length === 3 && (
                        <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                          {extraPinnedApps.slice(4).map((item) => {
                            const route = getAppRoute(item, 'HR');
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={getAppTitle(item, 'HR')}
                                bgColor={item.bgColor}
                                icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                                onPress={() => {
                                  if (route) router.push(route as any);
                                }}
                              />
                            );
                          })}
                          <QuickGrid8Item
                            title="Tất cả" bgColor="#E7F0F7"
                            icon={<LayoutGrid size={22} color="#102739" strokeWidth={1.4} />}
                            onPress={() => { setModalEditMode(false); setShowAllServicesModal(true); }}
                          />
                        </View>
                      )}
                      {extraPinnedApps.slice(4).length >= 4 && (
                        <>
                          <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                            {extraPinnedApps.slice(4).map((item) => {
                              const route = getAppRoute(item, 'HR');
                              return (
                                <QuickGrid8Item
                                  key={item.key}
                                  title={getAppTitle(item, 'HR')}
                                  bgColor={item.bgColor}
                                  icon={renderAppIcon(item.icon, item.color, 24, 1.4)}
                                  onPress={() => {
                                    if (route) router.push(route as any);
                                  }}
                                />
                              );
                            })}
                          </View>
                          <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                            <Pressable
                              style={({ pressed }) => [styles.quickGrid8Item, pressed && styles.quickGrid8ItemPressed]}
                              onPress={() => { setModalEditMode(true); setShowAllServicesModal(true); }}
                            >
                              <View style={[styles.quickIconBox8, styles.quickIconBoxAdd]}>
                                <Plus size={22} color="#94A3B8" strokeWidth={1.4} />
                              </View>
                              <Text style={[styles.quickGrid8Label, { color: '#64748B' }]} numberOfLines={1}>Thêm</Text>
                            </Pressable>
                            <View style={styles.quickGrid8Item} />
                            <View style={styles.quickGrid8Item} />
                            <QuickGrid8Item
                              title="Tất cả" bgColor="#F1F5F9"
                              icon={<LayoutGrid size={22} color="#475569" strokeWidth={1.4} />}
                              onPress={() => { setModalEditMode(false); setShowAllServicesModal(true); }}
                            />
                          </View>
                        </>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Nút mũi tên xuống (Chevron Down / Up) thiết kế capsule tinh tế */}
              <Pressable
                style={styles.expandToggleButton}
                onPress={handleToggleQuickExpanded}
                hitSlop={8}
              >
                <View style={styles.expandTogglePill}>
                  {isQuickExpanded ? (
                    <ChevronUp size={18} color="#64748B" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown size={18} color="#64748B" strokeWidth={1.5} />
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* ================= 5. HÒM THƯ GÓP Ý ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Hòm thư góp ý</Text>
              <Pressable onPress={() => router.push('/hr/feedbacks' as any)}>
                <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
              </Pressable>
            </View>

            {latestFeedback ? (
              <Pressable
                style={styles.feedbackCard}
                onPress={() => router.push(`/hr/feedbacks/${latestFeedback.id}` as any)}
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

          {/* ================= 6. BẢNG TIN NỘI BỘ (Chỉ hiển thị khi có bài viết thật) ================= */}
          {latestPost && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionMainTitle}>Bảng tin nội bộ</Text>
                <Pressable onPress={() => router.push('/hr/newsfeed' as any)}>
                  <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.newsCard}
                onPress={() => router.push('/hr/newsfeed' as any)}
              >
                <DashboardNewsThumbnail
                  imageUrl={
                    (latestPost as any)?.images?.[0] ||
                    (latestPost as any)?.coverUrl ||
                    (Array.isArray((latestPost as any)?.attachments)
                      ? (latestPost as any).attachments.find(
                          (a: any) => typeof a === 'string' && !a.startsWith('layout:') && /\.(jpg|jpeg|png|webp|gif)/i.test(a)
                        )
                      : null)
                  }
                  iconSize={26}
                />

                <View style={styles.newsContent}>
                  <View style={styles.newsTagPill}>
                    <Text style={styles.newsTagText}>NỘI BỘ</Text>
                  </View>

                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {(latestPost as any)?.title || (latestPost as any)?.content?.substring(0, 50) || 'Tin nội bộ'}
                  </Text>

                  <Text style={styles.newsSubtitle} numberOfLines={1}>
                    {(latestPost as any)?.author?.profile?.fullName
                      ? `Bởi ${(latestPost as any).author.profile.fullName}`
                      : (latestPost as any)?.author?.userCode
                      ? `Bởi ${(latestPost as any).author.userCode}`
                      : 'Bởi Ban Quản Trị'}
                  </Text>
                </View>

                <ChevronRight size={18} color="#94A3B8" strokeWidth={1.4} />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= MODAL: TẤT CẢ DỊCH VỤ HR / ACCOUNTANT ================= */}
      <AllServicesModal
        visible={showAllServicesModal}
        onClose={() => setShowAllServicesModal(false)}
        role="HR"
        initialEditMode={modalEditMode}
        pendingCounts={{
          pendingRequests: pendingRequestCount,
          dueTasks: dueTaskCount,
          pendingVault: pendingAdminVaultCount,
          pendingFinancial: pendingFinancialCount,
        }}
      />

      {/* Modal: Chọn chi nhánh nhân sự hoạt động */}
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

// Sub-component: Dashboard News Thumbnail
const DashboardNewsThumbnail = React.memo(function DashboardNewsThumbnail({
  imageUrl,
  iconSize = 26,
}: {
  imageUrl?: string | null;
  iconSize?: number;
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = useMemo(() => resolveFileUrl(imageUrl), [imageUrl]);

  if (resolvedUrl && !hasError) {
    return (
      <Image
        source={{ uri: resolvedUrl }}
        style={styles.newsThumbnail}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View style={[styles.newsThumbnail, styles.newsThumbnailFallback]}>
      <Newspaper size={iconSize} color="#2563EB" strokeWidth={1.4} />
    </View>
  );
});

// Sub-component: 8-Grid Quick Item (Rounded square container matching Image 1)
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
            <Text style={styles.quickItemBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickGrid8Label} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topOverscrollFill: {
    position: 'absolute',
    top: -500,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: '#102739',
  },
  scrollContainer: {
    backgroundColor: '#F5F7FA',
    paddingBottom: 24,
  },

  // 1. Deep Navy Header (#102739 - Matching Profile Screen & Admin)
  glossyHeader: {
    backgroundColor: '#102739',
    paddingHorizontal: 20,
    paddingBottom: 86,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCurve: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
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
    flex: 1,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarInitialsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102739',
  },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.82)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiHeaderButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FA3E3E',
    borderRadius: 10,
    minWidth: 19,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
  },

  // 2. Overlapping White Hero Card
  heroCardWrapper: {
    paddingHorizontal: 18,
    marginTop: -68,
    zIndex: 10,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  heroTopographicWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroTopographicBg: {
    width: '115%',
    height: '100%',
    transform: [{ translateX: -28 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminRoleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    maxWidth: 165,
  },
  adminRoleTagText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  attendanceHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  attendanceHeaderTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  cardHeaderDateText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '800',
  },
  dateNumberRow: {
    marginVertical: 4,
  },
  bigDateNumberText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.6,
  },
  cardMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
  },
  metricColLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingRight: 12,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#000000',
  },
  metricColStatRight: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  metricLabelCaps: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricNumberValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },

  // Content Body
  contentBody: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  // Sections
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  customizeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#102739',
  },

  // 3. Action Cards ("Cần bạn xử lý")
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  actionCardTexts: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  actionCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coralBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  coralBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },

  // 4. Quick Access Box (1 dòng thu gọn, dropdown mở rộng, tràn đều box)
  quickAccessBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quickGrid4Row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickGrid8Item: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  quickGrid8ItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  quickIconWrapper: {
    width: 58,
    height: 58,
    marginBottom: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconBox8: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconBoxAdd: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  quickGrid8Label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  extraRowsContainer: {
    width: '100%',
  },
  quickItemBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 20,
    elevation: 4,
  },
  quickItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
  expandToggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 2,
    marginTop: 2,
  },
  expandTogglePill: {
    width: 38,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // 5. Newsfeed Card
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  newsThumbnail: {
    width: 80,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  newsContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  newsTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  newsTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 2,
  },
  newsSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  newsThumbnailFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },

  // Feedback Cards
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feedbackLeftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  feedbackIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  feedbackContentSnippet: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  feedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  feedbackDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  feedbackActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedbackActionHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#102739',
  },
  feedbackEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  feedbackEmptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedbackEmptyInfo: {
    flex: 1,
  },
  feedbackEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  feedbackEmptyDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
