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

function formatVnHeroDate(d: Date): string {
  const dayName = VN_DAYS[d.getDay()] ?? 'Thứ hai';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
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

export function AttendanceHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userName = user?.fullName || user?.userCode || 'Đoàn Nam Dương';

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

  const heroDateString = useMemo(() => formatVnHeroDate(now), [now]);

  // Attendance live data
  const { data: currentAttendanceData, refetch: refetchCurrent } = useCurrentAttendance();
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

  // Current attendance state
  const isCheckedIn = currentAttendanceData?.state === 'CHECKED_IN';
  const isCheckedOut = currentAttendanceData?.state === 'CHECKED_OUT';
  const activeRecord = currentAttendanceData?.attendance;

  const checkInTimeDisplay = activeRecord?.checkInAt
    ? new Date(activeRecord.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const durationDisplay = useMemo(
    () => calculateWorkDuration(activeRecord?.checkInAt),
    [activeRecord?.checkInAt, now]
  );

  // Address & Branch
  const branchName =
    user?.department?.branch?.name ||
    (locationsData && locationsData[0]?.name) ||
    'MOVIELEGEND-HÀ NỘI';
  const branchAddress =
    user?.department?.branch?.address ||
    (locationsData && locationsData[0]?.address) ||
    '32 Hẻm 51/92 Ngõ Linh Quang, Văn Chương, Đống Đa, Hà Nội';

  // Role / Position display
  const userRoleText = useMemo(() => {
    if (user?.jobTitle?.name) return user.jobTitle.name;
    if (user?.position) return user.position;
    const roleList = (user?.roles || []).map((r: any) =>
      (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
    );
    if (roleList.some((r: string) => r.includes('ADMIN'))) return 'Quản trị viên';
    if (roleList.some((r: string) => r.includes('LEADER'))) return 'Trưởng phòng';
    if (roleList.some((r: string) => r.includes('HR'))) return 'Nhân viên';
    return 'Nhân viên';
  }, [user]);

  const userSubLine = `${user?.userCode || 'NV000026'} • ${userRoleText}`;

  // Routes based on user role
  const isLeader = useMemo(() => {
    const roleList = (user?.roles || []).map((r: any) =>
      (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
    );
    return roleList.some((r: string) => r.includes('LEADER'));
  }, [user?.roles]);

  const checkInRoute = isLeader ? '/leader/attendance/check-in' : '/employee/attendance/check-in';
  const checkOutRoute = isLeader ? '/leader/attendance/check-out' : '/employee/attendance/check-out';
  const historyRoute = isLeader ? '/leader/attendance-history' : '/employee/attendance/history';
  const scheduleRoute = isLeader ? '/leader/schedule' : '/employee/schedule';
  const timesheetRoute = isLeader ? '/leader/timesheet' : '/employee/timesheet';

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

  // History list items
  const historyItems = useMemo(() => {
    if (historyData?.items && historyData.items.length > 0) {
      return historyData.items;
    }
    return [];
  }, [historyData?.items]);

  const historyCount = historyItems.length > 0 ? historyItems.length : 5;

  return (
    <Screen
      backgroundColor="#102739"
      edges={['top', 'left', 'right']}
      statusBarStyle="light"
      statusBarTranslucent={false}
    >
      <View style={styles.mainWrapper}>
        {/* ================= 1. MIDNIGHT NAVY HEADER ================= */}
        <View style={styles.navHeader}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={() => router.back()}
                style={styles.iconButtonDark}
                hitSlop={8}
                accessibilityLabel="Quay lại"
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.screenTitleDark}>Chấm công</Text>
                <Text style={styles.screenSubtitleDark}>Điểm danh ca làm việc cá nhân</Text>
              </View>
            </View>
            <Pressable
              onPress={() => void onRefresh()}
              style={styles.iconButtonDark}
              hitSlop={8}
              accessibilityLabel="Làm mới"
            >
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* ================= 2. LIGHT SLATE CURVED SHEET ================= */}
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 40 },
          ]}
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
              <Avatar name={userName} uri={user?.avatarUrl} size={54} />
            </View>
            <View style={styles.userCardDetails}>
              <Text style={styles.userCardName} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={styles.userCardCode} numberOfLines={1}>
                {userSubLine}
              </Text>
              <Text style={styles.userCardBranch} numberOfLines={1}>
                {branchName.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Card 2: Hero Attendance Clock Card (Solid Midnight Navy #102739) */}
          <LinearGradient
            colors={['#0E2333', '#0A1C2A', '#06131E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardDark}
          >
            {/* Top Row: Date & Status Pill */}
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroDateRow}>
                <Ionicons name="calendar-outline" size={18} color="#38BDF8" />
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
                        : '#334155',
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

            {/* Giant Live Clock: 16:37:45 */}
            <View style={styles.heroClockWrap}>
              <Text style={styles.heroClockText}>{timeString}</Text>
            </View>

            {/* Middle Stats Row - Clean transparent layout matching template */}
            <View style={styles.heroStatsRow}>
              {/* Stat Col 1: Check-in Time */}
              <View style={styles.heroStatCol}>
                <View style={styles.heroStatIconWrap}>
                  <Ionicons name="log-in-outline" size={24} color="#38BDF8" />
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
                  <Ionicons name="time-outline" size={24} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroStatLabel}>Đã làm</Text>
                  <Text style={styles.heroStatDurationValue}>{durationDisplay}</Text>
                </View>
              </View>
            </View>

            {/* Big Action Button: Red/Rose (Điểm danh ra ca) or Vibrant Green (Điểm danh vào ca) */}
            <Pressable
              onPress={() => {
                if (isCheckedIn) {
                  router.push(checkOutRoute as any);
                } else {
                  router.push(checkInRoute as any);
                }
              }}
              style={({ pressed }) => [
                styles.heroActionBtn,
                pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
              ]}
            >
              <LinearGradient
                colors={
                  isCheckedIn
                    ? ['#F43F5E', '#E11D48']
                    : ['#00C475', '#009E5C']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.heroActionGradient}
              >
                <Ionicons
                  name={isCheckedIn ? 'log-out-outline' : 'finger-print'}
                  size={isCheckedIn ? 26 : 28}
                  color="#FFFFFF"
                />
                <Text style={styles.heroActionBtnText}>
                  {isCheckedIn ? 'Điểm danh ra ca' : 'Điểm danh vào ca'}
                </Text>
                <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </LinearGradient>

          {/* Card 3: Location Card (White Card) */}
          <View style={styles.locationCard}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location-sharp" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {branchName.toUpperCase()}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {cleanAddress(branchAddress)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          {/* Card 4 & 5: Two Quick Navigation Cards side-by-side */}
          <View style={styles.toolsRow}>
            {/* Tool 1: Bảng công */}
            <Pressable
              onPress={() => router.push(timesheetRoute as any)}
              style={({ pressed }) => [
                styles.toolCard,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.88 },
              ]}
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
              onPress={() => router.push(scheduleRoute as any)}
              style={({ pressed }) => [
                styles.toolCard,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.88 },
              ]}
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

          {/* Section: Lịch sử gần đây */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{historyCount}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push(historyRoute as any)}
              style={styles.viewAllBtn}
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
          ) : historyItems.length > 0 ? (
            <View style={styles.historyList}>
              {historyItems.map((item, index) => {
                const recordDate = new Date(item.workDate || item.checkInAt || Date.now());
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

                let statusLabel = 'Hoàn tất';
                let statusColor = '#059669';
                let statusBg = '#ECFDF5';

                if (isWorking) {
                  statusLabel = 'Đang trong ca';
                  statusColor = '#0284C7';
                  statusBg = '#EFF6FF';
                } else if (isMissedOut) {
                  statusLabel = 'Thiếu check-out';
                  statusColor = '#D97706';
                  statusBg = '#FEF3C7';
                } else if (isCompleted) {
                  statusLabel = 'Hoàn tất';
                  statusColor = '#059669';
                  statusBg = '#ECFDF5';
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
                    <View style={[styles.historyIconWrap, { backgroundColor: statusBg }]}>
                      <Ionicons
                        name={
                          isWorking
                            ? 'time-outline'
                            : isMissedOut
                            ? 'alert-circle-outline'
                            : 'checkmark-done'
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
          ) : (
            /* Fallback 3 items matching template when no records yet */
            <View style={styles.historyList}>
              {/* Item 1: Ca làm việc HÔM NAY */}
              <View style={styles.historyItemCard}>
                <View style={[styles.historyIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="time-outline" size={20} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.historyShiftName}>Ca làm việc</Text>
                    <View style={styles.todayPill}>
                      <Text style={styles.todayPillText}>HÔM NAY</Text>
                    </View>
                  </View>
                  <Text style={styles.historyDateText}>{heroDateString}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.historyTimeRange}>{checkInTimeDisplay} - --:--</Text>
                  <View style={[styles.historyStatusBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.historyStatusBadgeText, { color: '#0284C7' }]}>
                      {isCheckedIn ? 'Đang trong ca' : 'Chưa vào ca'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Item 2: Hôm qua */}
              <View style={styles.historyItemCard}>
                <View style={[styles.historyIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="alert-circle-outline" size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyShiftName}>Ca làm việc</Text>
                  <Text style={styles.historyDateText}>
                    {formatVnHeroDate(new Date(Date.now() - 86400000))}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.historyTimeRange}>08:57 - --:--</Text>
                  <View style={[styles.historyStatusBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.historyStatusBadgeText, { color: '#D97706' }]}>
                      Thiếu check-out
                    </Text>
                  </View>
                </View>
              </View>

              {/* Item 3: Hôm kia */}
              <View style={styles.historyItemCard}>
                <View style={[styles.historyIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="alert-circle-outline" size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyShiftName}>Ca làm việc</Text>
                  <Text style={styles.historyDateText}>
                    {formatVnHeroDate(new Date(Date.now() - 172800000))}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.historyTimeRange}>08:43 - --:--</Text>
                  <View style={[styles.historyStatusBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.historyStatusBadgeText, { color: '#D97706' }]}>
                      Thiếu check-out
                    </Text>
                  </View>
                </View>
              </View>
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
    backgroundColor: '#102739',
  },
  navHeader: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  screenTitleDark: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  screenSubtitleDark: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  sheetScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  userCardWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  userCardCode: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  userCardBranch: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  heroCardDark: {
    borderRadius: 28,
    padding: 22,
    marginTop: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDateText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  heroStatusPillWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroClockWrap: {
    alignItems: 'center',
    marginVertical: 18,
  },
  heroClockText: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  heroStatCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroStatIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroStatDurationValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    marginHorizontal: 10,
  },
  heroActionBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  heroActionGradient: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionBtnText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 0.2,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
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
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeCount: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeCountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyShiftName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
  },
  historyDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  historyTimeRange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
