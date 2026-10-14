import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  RefreshControl,
  Modal,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../providers/AuthProvider';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useMySchedule } from '../../hooks/useShifts';
import { useMyTasks } from '../../hooks/useTasks';
import { useMyEmployeeRequests } from '../../hooks/useEmployeeRequests';
import { useNewsfeedPosts } from '../../hooks/useNewsfeed';
import { useMyFeedbacks } from '../../hooks/useFeedback';
import { FeedbackStatusBadge } from '../feedback/components/FeedbackStatusBadge';
import { getMyVault } from '../../api/employees.api';
import { getNextVaultMilestone } from '../vault/vault-utils';
import { scheduleShiftNotifications, scheduleTaskNotifications } from '../../services/NotificationService';
import { Screen } from '../../components/Screen';
import { useUnreadNotificationCount, useUnreadChatCount } from '../../hooks/useNotifications';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
import { useTabBarScroll } from '../../components/navigation/tabBarVisibility';
import { resolveFileUrl } from '../../utils/url';

// Lucide Icons
import {
  Bell,
  MapPin,
  FileText,
  SquareCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  ClipboardCheck,
  Briefcase,
  LayoutGrid,
  Newspaper,
  Coins,
  Crown,
  Laptop,
  MessageSquare,
  Bot,
  Sparkles,
  X,
  Tv,
  Receipt,
  ArrowRightLeft,
  CalendarDays,
  FileSpreadsheet,
  Building2,
  FolderOpen,
  CreditCard,
  Zap,
  Plus,
} from 'lucide-react-native';

import { usePinnedApps } from '../../hooks/usePinnedApps';
import { APP_REGISTRY, getAppRoute, getAppTitle, AppRegistryItem } from '../../constants/app-registry';
import { AllServicesModal, renderAppIcon } from './components/AllServicesModal';
import { LiveClockText } from '../../components/common/LiveClockText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function EmployeeDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const tabBarScroll = useTabBarScroll();
  const { user } = useAuth();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [showAllServicesModal, setShowAllServicesModal] = useState(false);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);

  const handleToggleQuickExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsQuickExpanded(prev => !prev);
  }, []);

  // Pinned Apps System (1 dòng 4 app ban đầu, dropdown mở rộng app phụ + Tất cả)
  const { allPinnedApps, row1Apps, extraPinnedApps } = usePinnedApps('EMPLOYEE');

  // Queries
  const { data: currentAttendance } = useCurrentAttendance();
  const { data: schedule } = useMySchedule();
  const { data: myTasks } = useMyTasks({ limit: 100 });
  const { data: myRequestsData } = useMyEmployeeRequests({ status: 'PENDING' });
  const { data: unreadNotifications = 0 } = useUnreadNotificationCount();
  const { data: unreadChat = 0 } = useUnreadChatCount();
  const { data: newsPosts = [] } = useNewsfeedPosts();
  const { data: myFeedbacksData } = useMyFeedbacks({ limit: 5 });

  const pendingRequestsCount = useMemo(() => {
    if (typeof myRequestsData?.pagination?.total === 'number') {
      return myRequestsData.pagination.total;
    }
    if (Array.isArray(myRequestsData?.items)) {
      return myRequestsData.items.filter((r: any) => r.status === 'PENDING').length;
    }
    return 0;
  }, [myRequestsData]);

  const latestFeedback = useMemo(() => {
    const list = Array.isArray(myFeedbacksData)
      ? myFeedbacksData
      : (myFeedbacksData as any)?.items || [];
    return list.length > 0 ? list[0] : null;
  }, [myFeedbacksData]);

  const latestPost = useMemo(() => {
    const list = Array.isArray(newsPosts) ? newsPosts : (newsPosts as any)?.items || [];
    return list.length > 0 ? list[0] : null;
  }, [newsPosts]);

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

  const currentLevelNumber = levelProgress?.currentLevel?.levelNumber || 1;
  const levelColor = levelProgress?.currentLevel?.colorHex || LEVEL_COLORS[currentLevelNumber] || '#2563EB';
  const levelTitle =
    levelProgress?.currentLevel?.displayName ||
    levelProgress?.currentLevel?.badgeTitle ||
    LEVEL_DEFAULT_NAMES[currentLevelNumber] ||
    `Cấp ${currentLevelNumber}`;
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

  // Greeting by hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'CHÀO BUỔI SÁNG,';
    if (hour < 18) return 'CHÀO BUỔI CHIỀU,';
    return 'CHÀO BUỔI TỐI,';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'EM';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const fullName = user?.fullName || user?.userCode || 'Nhân viên';

  // Formatted date (DD.MM.YYYY e.g. 10.10.2026 đặt vào góc phải thay cho lời chào)
  const formattedTodayDate = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);



  const uncompletedTasksCount = useMemo(() => {
    return myTasks?.items?.filter(t => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length || 0;
  }, [myTasks]);

  const isLiveDept = useMemo(() => {
    if (!user) return false;
    const deptName = (user.department?.name || '').toLowerCase();
    const deptCode = (user.department?.code || '').toLowerCase();
    if (deptName.includes('live') || deptCode.includes('live')) return true;
    if (Array.isArray((user as any).departmentLinks)) {
      return (user as any).departmentLinks.some((l: any) => {
        const name = (l.department?.name || l.name || '').toLowerCase();
        const code = (l.department?.code || l.code || '').toLowerCase();
        return name.includes('live') || code.includes('live');
      });
    }
    return false;
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  // Handle Check-in / Check-out press
  const handleAttendancePress = () => {
    try {
      if (currentAttendance?.state === 'CHECKED_IN') {
        router.push('/employee/attendance/check-out' as any);
      } else {
        router.push('/employee/attendance/check-in' as any);
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể mở tính năng chấm công.',
      });
    }
  };

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

        {/* ================= 1. HEADER (#102739 - Matching Profile Screen) ================= */}
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
                onPress={() => router.push('/employee/leveling' as any)}
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
                  {fullName}
                </Text>
              </View>
            </View>

            {/* Header Right Actions: AI Assistant & Notification Bell */}
            <View style={styles.headerRightActions}>
              <Pressable
                style={styles.aiHeaderButton}
                onPress={() => router.push('/employee/ai-chat' as any)}
                accessibilityLabel="Trợ lý AI"
              >
                <Sparkles size={20} color="#FFFFFF" strokeWidth={2.2} />
              </Pressable>

              <Pressable
                style={styles.bellButton}
                onPress={() => router.push('/employee/notifications' as any)}
              >
                <Bell size={21} color="#FFFFFF" strokeWidth={2.2} />
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
                source={require('../../../assets/topographic-contour-employee-v2.png')}
                style={styles.heroTopographicBg}
                resizeMode="cover"
              />
            </View>

            {/* Top row inside card: Level Tag + Attendance Tag + Ngày hôm nay */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeftGroup}>
                <View style={styles.adminRoleTag}>
                  <Crown size={14} color="#1D4ED8" strokeWidth={2.5} />
                  <Text style={styles.adminRoleTagText} numberOfLines={1} ellipsizeMode="tail">
                    Lv.{currentLevelNumber} • {levelTitle}
                  </Text>
                </View>

                {/* Chữ ra ca / vào ca - nhẹ nhàng cạnh lv1 thực tập, không viền, chữ màu đen */}
                <Pressable
                  onPress={handleAttendancePress}
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

            {/* Big Bold Live Time: 07:44:45 */}
            <Pressable
              onPress={handleAttendancePress}
              style={({ pressed }) => [styles.dateNumberRow, pressed && { opacity: 0.75 }]}
              accessibilityRole="button"
              accessibilityLabel="Chấm công"
            >
              <LiveClockText style={styles.bigDateNumberText} />
            </Pressable>

            {/* Bottom Location Row (Đã bỏ công việc mở) */}
            <View style={styles.cardMetricsRow}>
              <View style={styles.metricColLocation}>
                <MapPin size={13} color="#000000" strokeWidth={2.2} />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  {user?.department?.branch?.name || (user?.department as any)?.branchName || 'MOVIELEGEND-HÀ NỘI'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* ================= 3. HÀNH TRÌNH & QUỸ THƯỞNG ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Hành trình &amp; Quỹ thưởng</Text>
            </View>

            <View style={styles.hubCard}>
              <Pressable
                style={styles.hubSegment}
                onPress={() => router.push('/employee/leveling' as any)}
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

              {isVaultEnabled && (
                <>
                  <View style={styles.hubDivider} />
                  <Pressable
                    style={styles.hubSegment}
                    onPress={() => router.push('/employee/vault' as any)}
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
                          Khả dụng: <Text style={styles.hubSubtitleGreen}>{unlockedVaultPoints.toLocaleString('vi-VN')} đ</Text>
                          {totalGrantedPoints > 0 ? ` • Quỹ: ${totalGrantedPoints.toLocaleString('vi-VN')} đ` : ''}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#94A3B8" />
                    </View>
                  </Pressable>
                </>
              )}
            </View>
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
                  const route = getAppRoute(item, 'EMPLOYEE');
                  const badge =
                    item.badgeKey === 'dueTasks'
                      ? (uncompletedTasksCount > 0 ? uncompletedTasksCount : undefined)
                      : undefined;

                  return (
                    <QuickGrid8Item
                      key={item.key}
                      title={getAppTitle(item, 'EMPLOYEE')}
                      bgColor={item.bgColor}
                      badge={badge}
                      icon={renderAppIcon(item.icon, item.color, 26)}
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
                        const route = getAppRoute(item, 'EMPLOYEE');
                        const badge =
                          item.badgeKey === 'dueTasks'
                            ? (uncompletedTasksCount > 0 ? uncompletedTasksCount : undefined)
                            : undefined;

                        return (
                          <QuickGrid8Item
                            key={item.key}
                            title={getAppTitle(item, 'EMPLOYEE')}
                            bgColor={item.bgColor}
                            badge={badge}
                            icon={renderAppIcon(item.icon, item.color, 26)}
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
                          <Plus size={24} color="#94A3B8" strokeWidth={2.2} />
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
                        icon={<LayoutGrid size={26} color="#475569" strokeWidth={2.2} />}
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
                          const route = getAppRoute(item, 'EMPLOYEE');
                          const badge =
                            item.badgeKey === 'dueTasks'
                              ? (uncompletedTasksCount > 0 ? uncompletedTasksCount : undefined)
                              : undefined;

                          return (
                            <QuickGrid8Item
                              key={item.key}
                              title={getAppTitle(item, 'EMPLOYEE')}
                              bgColor={item.bgColor}
                              badge={badge}
                              icon={renderAppIcon(item.icon, item.color, 26)}
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
                            const route = getAppRoute(item, 'EMPLOYEE');
                            const badge =
                              item.badgeKey === 'dueTasks'
                                ? (uncompletedTasksCount > 0 ? uncompletedTasksCount : undefined)
                                : undefined;
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={getAppTitle(item, 'EMPLOYEE')}
                                bgColor={item.bgColor}
                                badge={badge}
                                icon={renderAppIcon(item.icon, item.color, 26)}
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
                              <Plus size={24} color="#94A3B8" strokeWidth={2.2} />
                            </View>
                            <Text style={[styles.quickGrid8Label, { color: '#64748B' }]} numberOfLines={1}>Thêm</Text>
                          </Pressable>
                          {Array.from({ length: Math.max(0, 2 - extraPinnedApps.slice(4).length) }).map((_, i) => (
                            <View key={`empty-r3-${i}`} style={styles.quickGrid8Item} />
                          ))}
                          <QuickGrid8Item
                            title="Tất cả" bgColor="#E7F0F7"
                            icon={<LayoutGrid size={26} color="#102739" strokeWidth={2.2} />}
                            onPress={() => { setModalEditMode(false); setShowAllServicesModal(true); }}
                          />
                        </View>
                      )}
                      {extraPinnedApps.slice(4).length === 3 && (
                        <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                          {extraPinnedApps.slice(4).map((item) => {
                            const route = getAppRoute(item, 'EMPLOYEE');
                            const badge =
                              item.badgeKey === 'dueTasks'
                                ? (uncompletedTasksCount > 0 ? uncompletedTasksCount : undefined)
                                : undefined;
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={getAppTitle(item, 'EMPLOYEE')}
                                bgColor={item.bgColor}
                                badge={badge}
                                icon={renderAppIcon(item.icon, item.color, 26)}
                                onPress={() => {
                                  if (route) router.push(route as any);
                                }}
                              />
                            );
                          })}
                          <QuickGrid8Item
                            title="Tất cả" bgColor="#E7F0F7"
                            icon={<LayoutGrid size={26} color="#102739" strokeWidth={2.2} />}
                            onPress={() => { setModalEditMode(false); setShowAllServicesModal(true); }}
                          />
                        </View>
                      )}
                      {extraPinnedApps.slice(4).length >= 4 && (
                        <>
                          <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                            {extraPinnedApps.slice(4).map((item) => {
                              const route = getAppRoute(item, 'EMPLOYEE');
                              const badge =
                                item.badgeKey === 'dueTasks'
                                  ? (uncompletedTasksCount > 0 ? uncompletedTasksCount : undefined)
                                  : undefined;
                              return (
                                <QuickGrid8Item
                                  key={item.key}
                                  title={getAppTitle(item, 'EMPLOYEE')}
                                  bgColor={item.bgColor}
                                  badge={badge}
                                  icon={renderAppIcon(item.icon, item.color, 26)}
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
                                <Plus size={24} color="#94A3B8" strokeWidth={2.2} />
                              </View>
                              <Text style={[styles.quickGrid8Label, { color: '#64748B' }]} numberOfLines={1}>Thêm</Text>
                            </Pressable>
                            <View style={styles.quickGrid8Item} />
                            <View style={styles.quickGrid8Item} />
                            <QuickGrid8Item
                              title="Tất cả" bgColor="#F1F5F9"
                              icon={<LayoutGrid size={26} color="#475569" strokeWidth={2.2} />}
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
                    <ChevronUp size={15} color="#64748B" strokeWidth={2.5} />
                  ) : (
                    <ChevronDown size={15} color="#64748B" strokeWidth={2.5} />
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* ================= 5. CẦN BẠN XỬ LÝ ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Cần bạn xử lý</Text>
            </View>

            {/* Item 1: Đơn chờ duyệt */}
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push('/employee/requests' as any)}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: '#E7F0F7' }]}>
                  <View pointerEvents="none" style={styles.actionIconGloss} />
                  <FileText size={22} color="#102739" strokeWidth={2.2} />
                </View>
                <View style={styles.actionCardTexts}>
                  <Text style={styles.actionCardTitle}>Đơn từ &amp; Phép</Text>
                  <Text style={styles.actionCardDesc}>Nghỉ phép, tăng ca, giải trình</Text>
                </View>
              </View>

              <View style={styles.actionCardRight}>
                <View style={styles.coralBadge}>
                  <Text style={styles.coralBadgeText}>
                    {String(pendingRequestsCount).padStart(2, '0')}
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
              </View>
            </Pressable>

            {/* Item 2: Công việc đến hạn */}
            <Pressable
              style={[styles.actionCard, { marginTop: 10 }]}
              onPress={() => router.push('/employee/tasks' as any)}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: '#E7F0F7' }]}>
                  <View pointerEvents="none" style={styles.actionIconGloss} />
                  <Clock size={22} color="#102739" strokeWidth={2.2} />
                </View>
                <View style={styles.actionCardTexts}>
                  <Text style={styles.actionCardTitle}>Công việc đến hạn</Text>
                  <Text style={styles.actionCardDesc}>Cần hoàn thành hôm nay</Text>
                </View>
              </View>

              <View style={styles.actionCardRight}>
                <View style={styles.coralBadge}>
                  <Text style={styles.coralBadgeText}>
                    {String(uncompletedTasksCount).padStart(2, '0')}
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
              </View>
            </Pressable>
          </View>

          {/* ================= 6. HÒM THƯ GÓP Ý ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Hòm thư góp ý</Text>
              <Pressable onPress={() => router.push('/employee/feedbacks' as any)}>
                <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
              </Pressable>
            </View>

            {latestFeedback ? (
              <Pressable
                style={styles.feedbackCard}
                onPress={() => router.push(`/employee/feedbacks/${latestFeedback.id}` as any)}
              >
                <View style={styles.feedbackCardHeader}>
                  <View style={styles.feedbackLeftHeader}>
                    <View style={styles.feedbackIconCircle}>
                      <MessageSquare size={16} color="#102739" strokeWidth={2.2} />
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
                    {latestFeedback.createdAt ? new Date(latestFeedback.createdAt).toLocaleDateString('vi-VN') : ''}
                  </Text>
                  <View style={styles.feedbackActionRow}>
                    <Text style={styles.feedbackActionHint}>Chi tiết</Text>
                    <ChevronRight size={14} color="#102739" strokeWidth={2.2} />
                  </View>
                </View>
              </Pressable>
            ) : (
              <Pressable
                style={styles.feedbackEmptyCard}
                onPress={() => router.push('/employee/feedbacks/create' as any)}
              >
                <View style={styles.feedbackEmptyIconBox}>
                  <MessageSquare size={22} color="#102739" strokeWidth={2.2} />
                </View>
                <View style={styles.feedbackEmptyInfo}>
                  <Text style={styles.feedbackEmptyTitle}>Bạn có ý kiến hoặc đề xuất?</Text>
                  <Text style={styles.feedbackEmptyDesc} numberOfLines={2}>
                    Đóng góp ý kiến để cải thiện môi trường làm việc. Thông tin có thể gửi ẩn danh.
                  </Text>
                </View>
                <View style={styles.feedbackCreateButton}>
                  <Text style={styles.feedbackCreateButtonText}>Gửi góp ý</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* ================= 7. BẢNG TIN NỘI BỘ (Chỉ hiển thị khi có bài viết thật) ================= */}
          {latestPost && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionMainTitle}>Bảng tin nội bộ</Text>
                <Pressable onPress={() => router.push('/employee/newsfeed' as any)}>
                  <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.newsCard}
                onPress={() => router.push('/employee/newsfeed' as any)}
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
                  iconSize={28}
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

                <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= MODAL: TẤT CẢ TIỆN ÍCH NHÂN VIÊN ================= */}
      <AllServicesModal
        visible={showAllServicesModal}
        onClose={() => setShowAllServicesModal(false)}
        role="EMPLOYEE"
        initialEditMode={modalEditMode}
        pendingCounts={{
          dueTasks: uncompletedTasksCount,
        }}
      />
    </Screen>
  );
}

// Sub-component: Dashboard News Thumbnail
const DashboardNewsThumbnail = React.memo(function DashboardNewsThumbnail({
  imageUrl,
  iconSize = 28,
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
      <Newspaper size={iconSize} color="#2563EB" strokeWidth={1.8} />
    </View>
  );
});

// Sub-component: 8-Grid Quick Item
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

  // 1. Deep Navy Header (#102739 - Matching Profile Screen)
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
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    position: 'relative',
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
    gap: 8,
  },
  aiHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
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
    width: '100%',
    height: '100%',
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
    backgroundColor: '#E7F0F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    maxWidth: 165,
  },
  adminRoleTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#102739',
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
    fontSize: 9.5,
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
  overviewHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 16,
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
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
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
  actionIconGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
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
    color: '#334155',
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
    paddingTop: 10,
    paddingBottom: 2,
  },
  expandTogglePill: {
    width: 32,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 5. Hub Cấp Bậc & Quỹ Thưởng
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  hubSegment: {
    padding: 14,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hubIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hubInfoBlock: {
    flex: 1,
  },
  hubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  hubTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hubTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hubSubtitle: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  hubSubtitleGreen: {
    color: '#059669',
    fontWeight: '700',
  },
  hubProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    marginTop: 10,
    overflow: 'hidden',
  },
  hubProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  hubDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  vaultBadge: {
    backgroundColor: '#E7F0F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#102739',
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newsThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  newsContent: {
    flex: 1,
  },
  newsTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E7F0F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  newsTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#102739',
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 2,
  },
  newsSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  newsThumbnailFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E7F0F7',
  },

  // 6. Feedback Cards
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
    borderRadius: 12,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  feedbackEmptyInfo: {
    flex: 1,
    marginRight: 8,
  },
  feedbackEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  feedbackEmptyDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  feedbackCreateButton: {
    backgroundColor: '#102739',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  feedbackCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '82%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerSection: {
    marginBottom: 22,
  },
  drawerSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  modalServiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalTile: {
    width: (SCREEN_WIDTH - 40 - 20) / 3,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTileIconWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  modalTileBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  modalTileBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  modalTileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
});
