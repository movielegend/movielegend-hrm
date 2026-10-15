import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '../../components/Screen';
import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../providers/AuthProvider';
import {
  useCurrentAttendance,
  useAttendanceHistory,
  useActiveAttendanceLocations,
} from '../../hooks/useAttendance';
import { useMySchedule } from '../../hooks/useShifts';
import { colors } from '../../theme/colors';

interface RoleTheme {
  primaryDark: string;
  gradientColors: [string, string, ...string[]];
  accentGlow: string;
  secondaryGlow: string;
  roleBadgeText: string;
  roleBadgeColor: string;
  roleBadgeBg: string;
}

function getRoleTheme(roles?: any[]): RoleTheme {
  const roleList = (roles || []).map((r: any) =>
    (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
  );

  if (roleList.some((r: string) => r.includes('ADMIN'))) {
    return {
      primaryDark: '#0F172A',
      gradientColors: ['#1E293B', '#0F172A', '#020617'],
      accentGlow: 'rgba(59, 130, 246, 0.32)',
      secondaryGlow: 'rgba(245, 158, 11, 0.18)',
      roleBadgeText: 'Quản trị viên',
      roleBadgeColor: '#93C5FD',
      roleBadgeBg: 'rgba(59, 130, 246, 0.18)',
    };
  }
  if (roleList.some((r: string) => r.includes('ACCOUNT') || r.includes('KETOAN'))) {
    return {
      primaryDark: '#042F2E',
      gradientColors: ['#0A3B39', '#042F2E', '#021B1A'],
      accentGlow: 'rgba(20, 184, 166, 0.34)',
      secondaryGlow: 'rgba(13, 148, 136, 0.18)',
      roleBadgeText: 'Kế toán',
      roleBadgeColor: '#5EEAD4',
      roleBadgeBg: 'rgba(20, 184, 166, 0.18)',
    };
  }
  if (roleList.some((r: string) => r.includes('HR'))) {
    return {
      primaryDark: '#064E3B',
      gradientColors: ['#065F46', '#064E3B', '#02241B'],
      accentGlow: 'rgba(16, 185, 129, 0.34)',
      secondaryGlow: 'rgba(5, 150, 105, 0.18)',
      roleBadgeText: 'Nhân sự',
      roleBadgeColor: '#6EE7B7',
      roleBadgeBg: 'rgba(16, 185, 129, 0.18)',
    };
  }
  if (roleList.some((r: string) => r.includes('LEADER'))) {
    return {
      primaryDark: '#1E1B4B',
      gradientColors: ['#312E81', '#1E1B4B', '#0F0E28'],
      accentGlow: 'rgba(129, 140, 248, 0.34)',
      secondaryGlow: 'rgba(99, 102, 241, 0.18)',
      roleBadgeText: 'Quản lý',
      roleBadgeColor: '#C7D2FE',
      roleBadgeBg: 'rgba(129, 140, 248, 0.18)',
    };
  }
  if (roleList.some((r: string) => r.includes('WAREHOUSE'))) {
    return {
      primaryDark: '#2E1065',
      gradientColors: ['#3B0764', '#2E1065', '#14032C'],
      accentGlow: 'rgba(168, 85, 247, 0.34)',
      secondaryGlow: 'rgba(147, 51, 234, 0.18)',
      roleBadgeText: 'Thủ kho',
      roleBadgeColor: '#E9D5FF',
      roleBadgeBg: 'rgba(168, 85, 247, 0.18)',
    };
  }
  // Default EMPLOYEE (Midnight Navy / Sky Blue loang)
  return {
    primaryDark: '#102739',
    gradientColors: ['#102739', '#0C202F', '#071520'],
    accentGlow: 'rgba(2, 132, 199, 0.34)',
    secondaryGlow: 'rgba(14, 165, 233, 0.18)',
    roleBadgeText: 'Nhân viên',
    roleBadgeColor: '#7DD3FC',
    roleBadgeBg: 'rgba(2, 132, 199, 0.18)',
  };
}

const VN_DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function cleanAddress(addr?: string | null): string {
  if (!addr) return '';
  const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const uniqueParts: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueParts.push(part);
    }
  }
  return uniqueParts.join(', ');
}

function formatVnFullDate(d: Date): string {
  const dayName = (VN_DAYS[d.getDay()] ?? 'Thứ hai').toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${dayName}, ${day} THÁNG ${month}, ${year}`;
}

function formatVnShortDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function calculateWorkDuration(checkInAtStr?: string | null): string {
  if (!checkInAtStr) return '00 giờ 00 phút';
  const start = new Date(checkInAtStr).getTime();
  const diffMs = Math.max(0, Date.now() - start);
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')} giờ ${String(mins).padStart(2, '0')} phút`;
}

function formatVnHeroDate(d: Date): string {
  const dayName = VN_DAYS[d.getDay()] ?? 'Thứ hai';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

export function AttendanceHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userName = user?.fullName || user?.userCode || 'Nhân viên';
  const roleTheme = useMemo(() => getRoleTheme(user?.roles), [user?.roles]);

  // Live real-time clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const fullDateString = useMemo(() => formatVnFullDate(now), [now]);
  const heroDateString = useMemo(() => formatVnHeroDate(now), [now]);

  // Attendance live data
  const { data: currentAttendanceData, isLoading: isCurrentLoading, refetch: refetchCurrent } = useCurrentAttendance();
  const { data: scheduleData, refetch: refetchSchedule } = useMySchedule();
  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useAttendanceHistory({
    page: 1,
    limit: 5,
  });
  const { data: locationsData } = useActiveAttendanceLocations();

  // Find today's shift
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  const todayShift = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return null;
    return scheduleData.find(s => {
      if (!s.workDate) return false;
      const dStr = new Date(s.workDate).toISOString().substring(0, 10);
      return dStr === todayStr;
    });
  }, [scheduleData, todayStr]);

  // Current attendance state
  const isCheckedIn = currentAttendanceData?.state === 'CHECKED_IN';
  const isCheckedOut = currentAttendanceData?.state === 'CHECKED_OUT';
  const activeRecord = currentAttendanceData?.attendance;

  const checkInTimeDisplay = activeRecord?.checkInAt
    ? new Date(activeRecord.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const durationDisplay = useMemo(
    () => calculateWorkDuration(activeRecord?.checkInAt),
    // Re-calculate when `now` ticks every second if checked in
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeRecord?.checkInAt, now]
  );

  // Address
  const branchName = user?.department?.branch?.name || (locationsData && locationsData[0]?.name) || 'Văn phòng làm việc';
  const branchAddress =
    user?.department?.branch?.address ||
    (locationsData && locationsData[0]?.name) ||
    'Chưa cập nhật địa chỉ điểm chấm công';

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCurrent(),
      refetchSchedule(),
      refetchHistory(),
      queryClient.invalidateQueries(),
    ]);
    setRefreshing(false);
  }, [queryClient, refetchCurrent, refetchHistory, refetchSchedule]);

  // User roles check
  const isAdminOrLeaderOrHr = useMemo(() => {
    if (!user?.roles) return false;
    return (
      user.roles.includes('ADMIN') ||
      user.roles.includes('LEADER') ||
      user.roles.includes('HR')
    );
  }, [user?.roles]);

  const managementRoute = useMemo(() => {
    if (user?.roles?.includes('ADMIN')) return '/admin/attendance';
    if (user?.roles?.includes('HR')) return '/hr/attendance-management';
    if (user?.roles?.includes('LEADER')) return '/leader/attendance';
    return null;
  }, [user?.roles]);

  return (
    <Screen
      backgroundColor={roleTheme.primaryDark}
      edges={['top', 'left', 'right']}
      statusBarStyle="light"
      statusBarTranslucent={false}
    >
      <View style={[styles.mainWrapper, { backgroundColor: roleTheme.primaryDark }]}>
        {/* ================= 1. COMPACT DARK ROLE GRADIENT HEADER ================= */}
        <LinearGradient
          colors={roleTheme.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.navHeader}
        >
          {/* Subtle Decorative Role Loang Glows */}
          <View pointerEvents="none" style={[styles.roleLoangOrb, { backgroundColor: roleTheme.accentGlow }]} />
          <View pointerEvents="none" style={[styles.roleLoangSecondary, { backgroundColor: roleTheme.secondaryGlow }]} />

          {/* Header Navigation Row: Back button, Title, Subtitle, Refresh button */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable onPress={() => router.back()} style={styles.iconButtonDark} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.screenTitleDark}>Chấm công</Text>
                <Text style={styles.screenSubtitleDark}>Điểm danh ca làm việc cá nhân</Text>
              </View>
            </View>
            <Pressable onPress={() => void onRefresh()} style={styles.iconButtonDark} hitSlop={8}>
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ================= 2. WHITE CURVED SHEET (FORM CHUẨN NHƯ ẢNH) ================= */}
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor="#0284C7"
            />
          }
        >
          {/* Card 1: User Profile Card (White Card) */}
          <View style={styles.userCardWhite}>
            <View style={styles.avatarWrapWhite}>
              <Avatar name={userName} uri={user?.avatarUrl} size={50} />
            </View>
            <View style={styles.userCardDetails}>
              <Text style={styles.userCardName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.userCardCode} numberOfLines={1}>
                {user?.userCode ? `${user.userCode} • ` : ''}
                {user?.jobTitle?.name || user?.position || roleTheme.roleBadgeText}
              </Text>
              <Text style={styles.userCardBranch} numberOfLines={1}>
                {branchName.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Card 2: Hero Attendance Clock Card (Dark Navy Blue Curved Card) */}
          <LinearGradient
            colors={['#0F2844', '#0B1F34', '#061320']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardDark}
          >
            {/* Topographic contour ripples background */}
            <View pointerEvents="none" style={styles.heroTopographicWrapper}>
              <Image
                source={require('../../../assets/topographic-contour-employee-v2.png')}
                style={styles.heroTopographicBg}
                resizeMode="cover"
              />
            </View>

            {/* Top Row: Date & Status Pill */}
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroDateRow}>
                <Ionicons name="calendar-outline" size={15} color="#7DD3FC" />
                <Text style={styles.heroDateText}>{heroDateString}</Text>
              </View>

              <View style={styles.heroStatusPillWhite}>
                <View
                  style={[
                    styles.heroStatusDot,
                    {
                      backgroundColor: isCheckedIn
                        ? '#10B981'
                        : isCheckedOut
                        ? '#0284C7'
                        : '#94A3B8',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.heroStatusText,
                    {
                      color: isCheckedIn
                        ? '#059669'
                        : isCheckedOut
                        ? '#0369A1'
                        : '#475569',
                    },
                  ]}
                >
                  {isCheckedIn
                    ? 'Đang trong ca'
                    : isCheckedOut
                    ? 'Đã kết thúc ca'
                    : 'Chưa vào ca'}
                </Text>
              </View>
            </View>

            {/* Giant Live Clock */}
            <View style={styles.heroClockWrap}>
              <Text style={styles.heroClockText}>{timeString}</Text>
            </View>

            {/* Middle Stats Row */}
            <View style={styles.heroStatsRow}>
              {/* Stat Col 1: Check-in Time */}
              <View style={styles.heroStatCol}>
                <View style={styles.heroStatIconWrap}>
                  <Ionicons name="log-in-outline" size={20} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroStatLabel}>Giờ vào ca</Text>
                  <Text style={styles.heroStatValue}>{checkInTimeDisplay}</Text>
                </View>
              </View>

              {/* Vertical Divider */}
              <View style={styles.heroStatDivider} />

              {/* Stat Col 2: Duration */}
              <View style={styles.heroStatCol}>
                <View style={styles.heroStatIconWrap}>
                  <Ionicons name="time-outline" size={20} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroStatLabel}>Đã làm</Text>
                  <Text style={styles.heroStatValue}>{durationDisplay}</Text>
                </View>
              </View>
            </View>

            {/* Big Action Button */}
            <Pressable
              onPress={() => {
                if (isCheckedIn) {
                  router.push('/employee/attendance/check-out' as any);
                } else {
                  router.push('/employee/attendance/check-in' as any);
                }
              }}
              style={({ pressed }) => [
                styles.heroActionBtn,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
              ]}
            >
              <LinearGradient
                colors={
                  isCheckedIn
                    ? ['#F43F5E', '#E11D48']
                    : ['#0284C7', '#0369A1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.heroActionGradient}
              >
                <Ionicons
                  name={isCheckedIn ? 'log-out-outline' : 'finger-print'}
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={styles.heroActionBtnText}>
                  {isCheckedIn ? 'Điểm danh ra ca' : 'Điểm danh vào ca'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </LinearGradient>

          {/* Card 3: Location Card (White Card) */}
          <View style={styles.locationCard}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location-sharp" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.locationTitle} numberOfLines={1}>{branchName.toUpperCase()}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>{cleanAddress(branchAddress)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          {/* Card 4: Quick Nav Tools (Bảng công & Lịch làm việc side-by-side) */}
          <View style={styles.toolsRow}>
            {/* Tool 1: Bảng công */}
            <Pressable
              onPress={() => router.push('/employee/attendance/history' as any)}
              style={({ pressed }) => [styles.toolCard, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.toolIconSquare, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="calendar" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.toolCardTitle}>Bảng công</Text>
                <Text style={styles.toolCardSubtitle}>Chi tiết theo tháng</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </Pressable>

            {/* Tool 2: Lịch làm việc */}
            <Pressable
              onPress={() => router.push('/employee/schedule' as any)}
              style={({ pressed }) => [styles.toolCard, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.toolIconSquare, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="alarm" size={20} color="#EA580C" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.toolCardTitle}>Lịch làm việc</Text>
                <Text style={styles.toolCardSubtitle}>Xem phân ca tuần</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Admin/HR/Leader Shortcut Banner (if authorized) */}
          {isAdminOrLeaderOrHr && managementRoute && (
            <Pressable
              onPress={() => router.push(managementRoute as any)}
              style={({ pressed }) => [
                styles.managementBanner,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.managementIconWrap}>
                <Ionicons name="shield-checkmark" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.managementTitle}>Quản lý chấm công toàn công ty</Text>
                <Text style={styles.managementSubtitle}>
                  Xem quân số, phê duyệt công và theo dõi ca làm
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0284C7" />
            </Pressable>
          )}

          {/* Card 5: Recent History Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
              {historyData?.items && historyData.items.length > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{historyData.items.length}</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => router.push('/employee/attendance/history' as any)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              hitSlop={8}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={14} color="#0284C7" />
            </Pressable>
          </View>

          {isHistoryLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#0284C7" />
              <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>
                Đang tải lịch sử chấm công...
              </Text>
            </View>
          ) : !historyData?.items || historyData.items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="file-tray-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Chưa có bản ghi chấm công gần đây</Text>
              <Text style={styles.emptySubtitle}>
                Khi bạn vào ca hoặc tan ca, lịch sử điểm danh sẽ hiển thị tại đây.
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {historyData.items.map((item, index) => {
                const recordDate = new Date(item.workDate || item.checkInAt);
                const isToday =
                  recordDate.toISOString().substring(0, 10) === todayStr;

                const inTime = item.checkInAt
                  ? new Date(item.checkInAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--';
                const outTime = item.checkOutAt
                  ? new Date(item.checkOutAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--';

                const hasIn = Boolean(item.checkInAt);
                const hasOut = Boolean(item.checkOutAt);
                const isCompleted = hasIn && hasOut;
                const isWorking = hasIn && !hasOut && isToday;
                const isMissedOut = hasIn && !hasOut && !isToday;
                const isMissedIn = !hasIn && hasOut;

                let statusLabel = 'Nghỉ / Trống';
                let statusColor = '#64748B';
                let statusBg = '#F1F5F9';

                if (isCompleted) {
                  statusLabel = 'Hoàn tất';
                  statusColor = '#059669';
                  statusBg = '#ECFDF5';
                } else if (isWorking) {
                  statusLabel = 'Đang trong ca';
                  statusColor = '#0284C7';
                  statusBg = '#EFF6FF';
                } else if (isMissedOut) {
                  statusLabel = 'Thiếu check-out';
                  statusColor = '#D97706';
                  statusBg = '#FEF3C7';
                } else if (isMissedIn) {
                  statusLabel = 'Thiếu check-in';
                  statusColor = '#D97706';
                  statusBg = '#FEF3C7';
                }

                return (
                  <Pressable
                    key={item.id || index}
                    onPress={() => {
                      if (item.id) {
                        router.push(`/employee/attendance/${item.id}` as any);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.historyItemCard,
                      pressed && { backgroundColor: '#F8FAFC' },
                    ]}
                  >
                    <View
                      style={[
                        styles.historyIconWrap,
                        { backgroundColor: statusBg },
                      ]}
                    >
                      <Ionicons
                        name={
                          isCompleted
                            ? 'checkmark-done'
                            : isWorking
                            ? 'time-outline'
                            : 'alert-circle-outline'
                        }
                        size={20}
                        color={statusColor}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.historyShiftName}>
                          {item.shiftAssignment?.shift?.name || 'Ca làm việc'}
                        </Text>
                        {isToday && (
                          <View style={styles.todayPill}>
                            <Text style={styles.todayPillText}>HÔM NAY</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.historyDateText}>
                        {formatVnHeroDate(recordDate)}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.historyTimeRange}>
                        {inTime} - {outTime}
                      </Text>
                      <View style={[styles.historyStatusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.historyStatusBadgeText, { color: statusColor }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  navHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  roleLoangOrb: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  roleLoangSecondary: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButtonDark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  screenTitleDark: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  screenSubtitleDark: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 1,
  },
  sheetScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  userCardWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapWhite: {
    marginRight: 14,
  },
  userCardDetails: {
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  userCardCode: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  userCardBranch: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  heroCardDark: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopographicWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 240,
    height: '100%',
    overflow: 'hidden',
    opacity: 0.85,
  },
  heroTopographicBg: {
    width: '100%',
    height: '100%',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  heroStatusPillWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroClockWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  heroClockText: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
  },
  heroStatCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroStatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 8,
  },
  heroActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroActionGradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  heroActionBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  toolCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  toolIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  toolCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  managementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 18,
  },
  managementIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  managementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  managementSubtitle: {
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeCount: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyShiftName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  historyDateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyTimeRange: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  historyStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});

