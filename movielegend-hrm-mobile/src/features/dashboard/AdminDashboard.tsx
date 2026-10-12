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
  Modal,
  LayoutAnimation,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapData } from '../../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { useUnreadNotificationCount, useUnreadChatCount } from '../../hooks/useNotifications';
import { useAttendanceDashboardStats } from '../../hooks/useAttendance';
import { getVaultWithdrawalRequests } from '../../api/employees.api';
import { getEmployeeRequests } from '../../api/employee-requests.api';
import { useNewsfeedPosts } from '../../hooks/useNewsfeed';
import { useFeedbacksForManagement } from '../../hooks/useFeedback';
import { FeedbackStatusBadge } from '../feedback/components/FeedbackStatusBadge';
import { useMyTasks } from '../../hooks/useTasks';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, RadialGradient as SvgRadialGradient, Stop, Rect, Line } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Lucide Icons (Exact modern outline stroke matching the mockup template)
import {
  Bell,
  MapPin,
  FileText,
  SquareCheck,
  ChevronRight,
  Clock,
  Calendar,
  Users,
  ClipboardCheck,
  Briefcase,
  LayoutGrid,
  Newspaper,
  ShieldCheck,
  Coins,
  Crown,
  Bot,
  Laptop,
  MessageSquare,
  Sparkles,
  X,
  Building2,
  Receipt,
  Tv,
  CreditCard,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react-native';

import { usePinnedApps } from '../../hooks/usePinnedApps';
import { APP_REGISTRY, getAppRoute, AppRegistryItem } from '../../constants/app-registry';
import { AllServicesModal, renderAppIcon } from './components/AllServicesModal';
import { LiveClockText } from '../../components/common/LiveClockText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [showAllServicesModal, setShowAllServicesModal] = useState(false);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);

  // Pinned Apps System (1 dòng 4 app ban đầu, dropdown mở rộng app phụ + Tất cả)
  const { allPinnedApps, row1Apps, extraPinnedApps } = usePinnedApps();

  const handleToggleQuickExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsQuickExpanded(prev => !prev);
  }, []);

  // Notifications & Chats
  const { data: unreadNotifications = 0 } = useUnreadNotificationCount();
  const { data: unreadChat = 0 } = useUnreadChatCount();

  // Dashboard API Stats
  const { data: dashboardData } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/admin');
      return unwrapData(response) as any;
    },
  });

  // Attendance Stats
  const currentDateStr = new Date().toISOString().split('T')[0];
  const { data: attStats } = useAttendanceDashboardStats({ fromDate: currentDateStr, toDate: currentDateStr });

  // Pending Employee Requests (for "Đơn chờ duyệt")
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['admin-pending-requests-count'],
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
    queryKey: ['admin-pending-withdrawals-count'],
    queryFn: () => getVaultWithdrawalRequests({ limit: 1 }),
    staleTime: 1000 * 30,
  });
  const pendingAdminVaultCount =
    (withdrawalData as any)?.counts?.PENDING_ADMIN ??
    (withdrawalData as any)?.meta?.pendingAdminCount ??
    0;

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  // Greeting by hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'CHÀO BUỔI SÁNG,';
    if (hour < 18) return 'CHÀO BUỔI CHIỀU,';
    return 'CHÀO BUỔI TỐI,';
  };

  // Avatar Initials
  const getInitials = (name?: string) => {
    if (!name) return 'AL';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      const first = words[0]?.charAt(0) || '';
      const last = words[words.length - 1]?.charAt(0) || '';
      return `${first}${last}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Formatted date (DD.MM.YYYY e.g. 10.10.2026 đặt vào góc phải thay cho lời chào)
  const formattedTodayDate = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  // Compute live metrics or realistic fallback matching mockup
  const presentCount = attStats?.present ?? dashboardData?.attendanceToday?.checkedIn ?? 10;
  const totalStaff = attStats?.totalUsers ?? dashboardData?.employees?.active ?? 37;
  const openTasks = dashboardData?.tasks?.totalActive ?? (dueTasksCount > 0 ? dueTasksCount : 4);
  const pendingRequestCount = pendingRequests.length;
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top overscroll guard: màu xanh khớp đỉnh header khi kéo xuống */}
        <View pointerEvents="none" style={styles.topOverscrollFill} />

        {/* ================= 1. GLOSSY HEADER (Navy #102739 Gradient) ================= */}
        <LinearGradient
          colors={['#102739', '#143147', '#183B55', '#225275']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.glossyHeader, { paddingTop: Math.max(insets.top, 16) + 6 }]}
        >
          {/* Specular Light Flare & Glass Gloss Waves */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
              <Defs>
                {/* 1. Loang loang: Vùng sáng cực quang (Aura light bleed) góc trên bên phải */}
                <SvgRadialGradient
                  id="admHeaderAuraRight"
                  cx="85%"
                  cy="20%"
                  rx="60%"
                  ry="50%"
                  fx="85%"
                  fy="20%"
                >
                  <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
                  <Stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#102739" stopOpacity="0" />
                </SvgRadialGradient>

                {/* 2. Loang loang: Vệt sáng chìm góc dưới trái */}
                <SvgRadialGradient
                  id="admHeaderAuraLeft"
                  cx="15%"
                  cy="85%"
                  rx="50%"
                  ry="50%"
                  fx="15%"
                  fy="85%"
                >
                  <Stop offset="0%" stopColor="#60A5FA" stopOpacity="0.18" />
                  <Stop offset="60%" stopColor="#3B82F6" stopOpacity="0.06" />
                  <Stop offset="100%" stopColor="#102739" stopOpacity="0" />
                </SvgRadialGradient>

                {/* 3. Dải vệt sáng chéo mờ (Diagonal light beam) */}
                <SvgLinearGradient id="glossHighlight" x1="0%" y1="0%" x2="100%" y2="80%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
                  <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.06" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </SvgLinearGradient>

                {/* 4. Sọc chéo vi tế (Subtle diagonal accent line) */}
                <SvgLinearGradient id="admLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
                  <Stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.18" />
                  <Stop offset="70%" stopColor="#38BDF8" stopOpacity="0.22" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </SvgLinearGradient>
              </Defs>

              {/* Lớp nền loang ánh sáng (Ambient Aura Blurs - hiệu ứng loang mềm mại) */}
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#admHeaderAuraRight)" />
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#admHeaderAuraLeft)" />

              {/* Dải phản chiếu chéo bóng bẩy */}
              <Path
                d="M -60 -40 L 260 -40 L 140 240 L -60 240 Z"
                fill="url(#glossHighlight)"
              />

              {/* Các đường sọc chéo vi tế thanh mảnh thay cho vòng tròn */}
              <Line
                x1={SCREEN_WIDTH - 120}
                y1={-10}
                x2={SCREEN_WIDTH + 80}
                y2={190}
                stroke="url(#admLineGrad)"
                strokeWidth={2}
                strokeDasharray="6, 6"
              />
              <Line
                x1={SCREEN_WIDTH - 60}
                y1={-10}
                x2={SCREEN_WIDTH + 140}
                y2={190}
                stroke="url(#admLineGrad)"
                strokeWidth={1.5}
              />
              <Line
                x1={SCREEN_WIDTH - 180}
                y1={-10}
                x2={SCREEN_WIDTH + 20}
                y2={190}
                stroke="url(#admLineGrad)"
                strokeWidth={1}
                strokeDasharray="4, 8"
                opacity={0.6}
              />
            </Svg>
          </View>

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
                onPress={() => router.push('/admin/levels' as any)}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitialsText}>{getInitials(user?.fullName)}</Text>
                )}
              </Pressable>

              {/* Greeting & Name */}
              <View style={styles.userTextCol}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user?.fullName || 'Admin Movie Legend'}
                </Text>
              </View>
            </View>

            {/* Frosted Glass Notification Bell Button */}
            <Pressable
              style={styles.bellButton}
              onPress={() => router.push('/admin/notifications' as any)}
            >
              <Bell size={22} color="#FFFFFF" strokeWidth={1.5} />
              {unreadNotifications > 0 && <View style={styles.bellRedDot} />}
            </Pressable>
          </View>
        </LinearGradient>

        {/* ================= 2. HERO CARD (OVERVIEW WHITE CARD CÓ RIPPLE) ================= */}
        <View style={styles.heroCardWrapper}>
          <View style={styles.heroCard}>
            {/* Vân địa hình hữu cơ / Topographic contour ripples - Đỏ cho Admin */}
            <View pointerEvents="none" style={styles.heroTopographicWrapper}>
              <Image
                source={require('../../../assets/topographic-contour-admin-v2.png')}
                style={styles.heroTopographicBg}
                resizeMode="cover"
              />
            </View>

            {/* Top row inside card: Quản trị hệ thống Tag + Ngày hôm nay thay lời chào */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.adminRoleTag}>
                <ShieldCheck size={14} color="#DC2626" strokeWidth={1.5} />
                <Text style={styles.adminRoleTagText}>Quản trị hệ thống</Text>
              </View>
              <Text style={styles.cardHeaderDateText}>
                {formattedTodayDate}
              </Text>
            </View>

            {/* Big Bold Live Time: 09:42:15 */}
            <View style={styles.dateNumberRow}>
              <LiveClockText style={styles.bigDateNumberText} />
            </View>

            {/* Bottom 3-Column Metrics Row (Không dính vào nhau) */}
            <View style={styles.cardMetricsRow}>
              {/* Col 1: Location */}
              <View style={styles.metricColLocation}>
                <MapPin size={13} color="#000000" strokeWidth={1.8} />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  Văn phòng Hà Nội
                </Text>
              </View>

              <View style={styles.metricsVerticalDivider} />

              {/* Col 2: Nhân sự có mặt */}
              <Pressable
                style={styles.metricColStatCenter}
                onPress={() => router.push('/admin/attendance' as any)}
              >
                <Text style={styles.metricLabelCaps} numberOfLines={1}>NHÂN SỰ CÓ MẶT</Text>
                <Text style={styles.metricNumberValue}>
                  {presentCount} <Text style={styles.metricSubDivider}>/ {totalStaff}</Text>
                </Text>
              </Pressable>

              <View style={styles.metricsVerticalDivider} />

              {/* Col 3: Công việc đang mở */}
              <Pressable
                style={styles.metricColStatRight}
                onPress={() => router.push('/admin/tasks' as any)}
              >
                <Text style={styles.metricLabelCaps} numberOfLines={1}>CÔNG VIỆC MỞ</Text>
                <Text style={styles.metricNumberValue}>{openTasks}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* Section: Tổng quan hôm nay */}
          <Text style={styles.overviewHeading}>Tổng quan hôm nay</Text>

          {/* ================= 3. CẦN BẠN XỬ LÝ ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Cần bạn xử lý</Text>
            </View>

            {/* Item 1: Đơn chờ duyệt */}
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push('/leader/approvals' as any)}
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

            {/* Item 2: Công việc đến hạn */}
            <Pressable
              style={[styles.actionCard, { marginTop: 10 }]}
              onPress={() => router.push('/admin/tasks' as any)}
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
                  const route = getAppRoute(item, 'ADMIN');
                  const badge =
                    item.badgeKey === 'pendingRequests'
                      ? (pendingRequestCount > 0 ? pendingRequestCount : undefined)
                      : item.badgeKey === 'dueTasks'
                      ? (dueTaskCount > 0 ? dueTaskCount : undefined)
                      : undefined;

                  return (
                    <QuickGrid8Item
                      key={item.key}
                      title={item.title}
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
                        const route = getAppRoute(item, 'ADMIN');
                        return (
                          <QuickGrid8Item
                            key={item.key}
                            title={item.title}
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
                          const route = getAppRoute(item, 'ADMIN');
                          return (
                            <QuickGrid8Item
                              key={item.key}
                              title={item.title}
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
                            const route = getAppRoute(item, 'ADMIN');
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={item.title}
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
                            const route = getAppRoute(item, 'ADMIN');
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={item.title}
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
                              const route = getAppRoute(item, 'ADMIN');
                              return (
                                <QuickGrid8Item
                                  key={item.key}
                                  title={item.title}
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
              <Pressable onPress={() => router.push('/admin/feedbacks' as any)}>
                <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
              </Pressable>
            </View>

            {latestFeedback ? (
              <Pressable
                style={styles.feedbackCard}
                onPress={() => router.push(`/admin/feedbacks/${latestFeedback.id}` as any)}
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
                <Pressable onPress={() => router.push('/admin/news' as any)}>
                  <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.newsCard}
                onPress={() => router.push('/admin/news' as any)}
              >
                {((latestPost as any)?.images?.[0] || (latestPost as any)?.coverUrl) ? (
                  <Image
                    source={{
                      uri: (latestPost as any)?.images?.[0] || (latestPost as any)?.coverUrl,
                    }}
                    style={styles.newsThumbnail}
                  />
                ) : (
                  <View style={[styles.newsThumbnail, styles.newsThumbnailFallback]}>
                    <Newspaper size={26} color="#2563EB" strokeWidth={1.4} />
                  </View>
                )}

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

      {/* ================= MODAL: TẤT CẢ DỊCH VỤ ADMIN ================= */}
      <AllServicesModal
        visible={showAllServicesModal}
        onClose={() => setShowAllServicesModal(false)}
        role="ADMIN"
        initialEditMode={modalEditMode}
        pendingCounts={{
          pendingRequests: pendingRequestCount,
          dueTasks: dueTaskCount,
          pendingVault: pendingAdminVaultCount,
        }}
      />
    </Screen>
  );
}

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
      <View style={[styles.quickIconBox8, { backgroundColor: bgColor }]}>
        {icon}
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

  // 1. Glossy Royal Blue Header
  glossyHeader: {
    paddingHorizontal: 20,
    paddingBottom: 86,
    position: 'relative',
    overflow: 'hidden',
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
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellRedDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  adminRoleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  adminRoleTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
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
    flex: 1.15,
    paddingRight: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  metricsVerticalDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginHorizontal: 4,
  },
  metricColStatCenter: {
    flex: 1.05,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricColStatRight: {
    flex: 0.95,
    alignItems: 'flex-end',
    paddingLeft: 4,
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
  metricSubDivider: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
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
  quickIconBox8: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  iconGlossHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
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
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  quickItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
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
