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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { getDashboardByRole } from '../../api/dashboard.api';
import { getVaultWithdrawalRequests } from '../../api/employees.api';
import { getEmployeeRequests } from '../../api/employee-requests.api';
import { useUnreadNotificationCount, useUnreadChatCount } from '../../hooks/useNotifications';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useMyTasks } from '../../hooks/useTasks';
import { useNewsfeedPosts } from '../../hooks/useNewsfeed';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

// Lucide Icons
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
  Laptop,
  MessageSquare,
  Sparkles,
  X,
  Tv,
  Receipt,
  ArrowRightLeft,
  CalendarDays,
  PlusCircle,
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

export function LeaderDashboard() {
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
  const { data: currentAttendance } = useCurrentAttendance();

  // Tasks
  const { data: myTasks } = useMyTasks({ limit: 30 });
  const myTasksUncompletedCount = useMemo(() => {
    return myTasks?.items?.filter((t: any) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length || 0;
  }, [myTasks]);

  // Dashboard API
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', 'LEADER'],
    queryFn: () => getDashboardByRole('LEADER'),
  });

  // Department info
  const deptStats = (dashboardData?.department as any) || {
    activeEmployeeCount: 0,
    checkedInCount: 0,
    onLeaveToday: 0,
  };
  const checkedInCount = deptStats.checkedInCount || 10;
  const activeStaffCount = deptStats.activeEmployeeCount || 37;

  // Pending approvals
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['leader-pending-requests'],
    queryFn: async () => {
      try {
        const res = await getEmployeeRequests({ status: 'PENDING' });
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 30,
  });
  const pendingCount = pendingRequests.length > 0 ? pendingRequests.length : 5;
  const dueTaskCount = myTasksUncompletedCount > 0 ? myTasksUncompletedCount : 2;

  // Newsfeed
  const { data: newsPosts = [] } = useNewsfeedPosts();
  const latestPost = useMemo(() => {
    return Array.isArray(newsPosts) && newsPosts.length > 0 ? newsPosts[0] : null;
  }, [newsPosts]);

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
    if (!name) return 'LD';
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

  const departmentName =
    user?.department?.name ||
    (Array.isArray((user as any)?.departmentLinks) && (user as any).departmentLinks[0]?.department?.name) ||
    'Quản lý Đội ngũ';

  return (
    <Screen backgroundColor="#F8FAFC">
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= 1. GLOSSY ROYAL BLUE HEADER (Nửa box trên bóng bẩy) ================= */}
        <LinearGradient
          colors={['#002C88', '#0748BD', '#1064EE', '#2575FC']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.glossyHeader, { paddingTop: Math.max(insets.top, 16) + 6 }]}
        >
          {/* Specular Light Flare & Glass Waves */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
              <Defs>
                <SvgLinearGradient id="leaderGlossHighlight" x1="0%" y1="0%" x2="100%" y2="80%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                  <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </SvgLinearGradient>
              </Defs>
              <Path
                d="M -60 -40 L 260 -40 L 140 240 L -60 240 Z"
                fill="url(#leaderGlossHighlight)"
              />
              <Circle cx={SCREEN_WIDTH - 20} cy={30} r={140} fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth={24} />
              <Circle cx={SCREEN_WIDTH - 20} cy={30} r={90} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth={16} />
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
                onPress={() => router.push('/leader/my-profile' as any)}
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
                  {user?.fullName || 'Leader Quản lý'}
                </Text>
              </View>
            </View>

            {/* Frosted Glass Notification Bell Button */}
            <Pressable
              style={styles.bellButton}
              onPress={() => router.push('/leader/notifications' as any)}
            >
              <Bell size={21} color="#FFFFFF" strokeWidth={2.2} />
              {unreadNotifications > 0 && <View style={styles.bellRedDot} />}
            </Pressable>
          </View>
        </LinearGradient>

        {/* ================= 2. HERO CARD (OVERVIEW WHITE CARD CÓ RIPPLE) ================= */}
        <View style={styles.heroCardWrapper}>
          <View style={styles.heroCard}>
            {/* Concentric circular ripples on the right side */}
            <View pointerEvents="none" style={styles.cardRippleWrapper}>
              <Svg width={220} height={220} viewBox="0 0 220 220">
                <Circle cx={170} cy={105} r={120} stroke="#E0F2FE" strokeWidth={26} fill="none" opacity={0.65} />
                <Circle cx={170} cy={105} r={84} stroke="#BAE6FD" strokeWidth={20} fill="none" opacity={0.55} />
                <Circle cx={170} cy={105} r={48} stroke="#7DD3FC" strokeWidth={14} fill="none" opacity={0.4} />
              </Svg>
            </View>

            {/* Top row inside card: Quản lý bộ phận Tag + Ngày hôm nay thay lời chào */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.adminRoleTag}>
                <SquareCheck size={14} color="#1D4ED8" strokeWidth={2.5} />
                <Text style={styles.adminRoleTagText}>{departmentName}</Text>
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
                <MapPin size={13} color="#64748B" strokeWidth={2.2} />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  Văn phòng Hà Nội
                </Text>
              </View>

              <View style={styles.metricsVerticalDivider} />

              {/* Col 2: Nhân sự có mặt */}
              <Pressable
                style={styles.metricColStatCenter}
                onPress={() => router.push('/leader/schedule' as any)}
              >
                <Text style={styles.metricLabelCaps} numberOfLines={1}>NHÂN SỰ CÓ MẶT</Text>
                <Text style={styles.metricNumberValue}>
                  {checkedInCount} <Text style={styles.metricSubDivider}>/ {activeStaffCount}</Text>
                </Text>
              </Pressable>

              <View style={styles.metricsVerticalDivider} />

              {/* Col 3: Công việc đang mở */}
              <Pressable
                style={styles.metricColStatRight}
                onPress={() => router.push('/leader/tasks' as any)}
              >
                <Text style={styles.metricLabelCaps} numberOfLines={1}>CÔNG VIỆC MỞ</Text>
                <Text style={styles.metricNumberValue}>{dueTaskCount}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* Section: Tổng quan hôm nay */}
          <Text style={styles.overviewHeading}>Tổng quan hôm nay</Text>

          {/* ================= 3. CẦN BẠN XỬ LÝ (Dữ liệu minh họa) ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Cần bạn xử lý</Text>
              <Text style={styles.sectionSubtitle}>Dữ liệu minh họa</Text>
            </View>

            {/* Item 1: Đơn chờ duyệt */}
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push('/leader/approvals' as any)}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <FileText size={22} color="#2563EB" strokeWidth={2} />
                </View>
                <View style={styles.actionCardTexts}>
                  <Text style={styles.actionCardTitle}>Đơn chờ duyệt</Text>
                  <Text style={styles.actionCardDesc}>Nghỉ phép, tăng ca</Text>
                </View>
              </View>

              <View style={styles.actionCardRight}>
                <View style={styles.coralBadge}>
                  <Text style={styles.coralBadgeText}>
                    {String(pendingCount).padStart(2, '0')}
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
              </View>
            </Pressable>

            {/* Item 2: Công việc đến hạn */}
            <Pressable
              style={[styles.actionCard, { marginTop: 10 }]}
              onPress={() => router.push('/leader/tasks' as any)}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Clock size={22} color="#2563EB" strokeWidth={2} />
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
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
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
                  const route = getAppRoute(item, 'LEADER');
                  const badge =
                    item.badgeKey === 'pendingRequests'
                      ? (pendingCount > 0 ? pendingCount : undefined)
                      : item.badgeKey === 'dueTasks'
                      ? (dueTaskCount > 0 ? dueTaskCount : undefined)
                      : undefined;

                  return (
                    <QuickGrid8Item
                      key={item.key}
                      title={item.title}
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
                        const route = getAppRoute(item, 'LEADER');
                        return (
                          <QuickGrid8Item
                            key={item.key}
                            title={item.title}
                            bgColor={item.bgColor}
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
                          const route = getAppRoute(item, 'LEADER');
                          return (
                            <QuickGrid8Item
                              key={item.key}
                              title={item.title}
                              bgColor={item.bgColor}
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
                            const route = getAppRoute(item, 'LEADER');
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={item.title}
                                bgColor={item.bgColor}
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
                            title="Tất cả" bgColor="#F1F5F9"
                            icon={<LayoutGrid size={26} color="#475569" strokeWidth={2.2} />}
                            onPress={() => { setModalEditMode(false); setShowAllServicesModal(true); }}
                          />
                        </View>
                      )}
                      {extraPinnedApps.slice(4).length === 3 && (
                        <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                          {extraPinnedApps.slice(4).map((item) => {
                            const route = getAppRoute(item, 'LEADER');
                            return (
                              <QuickGrid8Item
                                key={item.key}
                                title={item.title}
                                bgColor={item.bgColor}
                                icon={renderAppIcon(item.icon, item.color, 26)}
                                onPress={() => {
                                  if (route) router.push(route as any);
                                }}
                              />
                            );
                          })}
                          <QuickGrid8Item
                            title="Tất cả" bgColor="#F1F5F9"
                            icon={<LayoutGrid size={26} color="#475569" strokeWidth={2.2} />}
                            onPress={() => { setModalEditMode(false); setShowAllServicesModal(true); }}
                          />
                        </View>
                      )}
                      {extraPinnedApps.slice(4).length >= 4 && (
                        <>
                          <View style={[styles.quickGrid4Row, { marginTop: 14 }]}>
                            {extraPinnedApps.slice(4).map((item) => {
                              const route = getAppRoute(item, 'LEADER');
                              return (
                                <QuickGrid8Item
                                  key={item.key}
                                  title={item.title}
                                  bgColor={item.bgColor}
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

              {/* Nút mũi tên xuống (Chevron Down / Up) luôn có mặt để mở/đóng dropdown */}
              <Pressable
                style={styles.expandToggleButton}
                onPress={handleToggleQuickExpanded}
                hitSlop={8}
              >
                {isQuickExpanded ? (
                  <ChevronUp size={20} color="#94A3B8" strokeWidth={2.2} />
                ) : (
                  <ChevronDown size={20} color="#94A3B8" strokeWidth={2.2} />
                )}
              </Pressable>
            </View>
          </View>

          {/* ================= 5. BẢNG TIN NỘI BỘ ================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionMainTitle}>Bảng tin nội bộ</Text>
              <Pressable onPress={() => router.push('/leader/newsfeed' as any)}>
                <Text style={styles.customizeLink}>Xem tất cả &gt;</Text>
              </Pressable>
            </View>

            {/* News Card */}
            <Pressable
              style={styles.newsCard}
              onPress={() => router.push('/leader/newsfeed' as any)}
            >
              <Image
                source={{
                  uri:
                    (latestPost as any)?.images?.[0] ||
                    (latestPost as any)?.coverUrl ||
                    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
                }}
                style={styles.newsThumbnail}
              />

              <View style={styles.newsContent}>
                <View style={styles.newsTagPill}>
                  <Text style={styles.newsTagText}>NỘI BỘ</Text>
                </View>

                <Text style={styles.newsTitle} numberOfLines={2}>
                  {(latestPost as any)?.title || 'Kết nối đội ngũ Movie Legend'}
                </Text>

                <Text style={styles.newsSubtitle} numberOfLines={1}>
                  {(latestPost as any)?.author?.fullName ? `Bởi ${(latestPost as any).author.fullName}` : 'Bản tin mẫu dành cho nhân viên'}
                </Text>
              </View>

              <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ================= MODAL: TẤT CẢ DỊCH VỤ LEADER ================= */}
      <AllServicesModal
        visible={showAllServicesModal}
        onClose={() => setShowAllServicesModal(false)}
        role="LEADER"
        initialEditMode={modalEditMode}
        pendingCounts={{
          pendingRequests: pendingCount,
          dueTasks: dueTaskCount,
        }}
      />
    </Screen>
  );
}

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
  scrollContainer: {
    paddingBottom: 24,
  },

  // 1. Glossy Royal Blue Header
  glossyHeader: {
    paddingHorizontal: 20,
    paddingBottom: 38,
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
    color: '#002C88',
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
    marginTop: -22,
    zIndex: 10,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#002C88',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardRippleWrapper: {
    position: 'absolute',
    right: -25,
    top: -10,
    bottom: -10,
    width: 220,
    overflow: 'hidden',
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  adminRoleTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardHeaderDateText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  dateNumberRow: {
    marginVertical: 4,
  },
  bigDateNumberText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
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
    fontWeight: '600',
    color: '#64748B',
  },
  metricsVerticalDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#F1F5F9',
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
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricNumberValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSubDivider: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
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
    color: '#2563EB',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    paddingBottom: 6,
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
    opacity: 0.7,
  },
  quickIconBox8: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickIconBoxAdd: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
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
    paddingTop: 10,
    paddingBottom: 4,
    marginTop: 4,
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
