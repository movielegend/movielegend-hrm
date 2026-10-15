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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../providers/AuthProvider';
import {
  useCurrentAttendance,
  useAttendanceHistory,
  useActiveAttendanceLocations,
} from '../../hooks/useAttendance';
import { useMySchedule } from '../../hooks/useShifts';
import { colors } from '../../theme/colors';

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
  if (!checkInAtStr) return '00:00h';
  const start = new Date(checkInAtStr).getTime();
  const diffMs = Math.max(0, Date.now() - start);
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}h`;
}

export function AttendanceHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userName = user?.fullName || user?.userCode || 'Nhân viên';

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#0284C7" />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#0B3B61" />
            </Pressable>
            <View>
              <Text style={styles.screenTitle}>Chấm công</Text>
              <Text style={styles.screenSubtitle}>Điểm danh ca làm việc cá nhân</Text>
            </View>
          </View>
          <Pressable onPress={() => void onRefresh()} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="refresh-outline" size={22} color="#0284C7" />
          </Pressable>
        </View>

        {/* User Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfoRow}>
            <Avatar name={userName} uri={user?.avatarUrl} size={48} />
            <View style={styles.userDetails}>
              <Text style={styles.userNameText}>{userName}</Text>
              <Text style={styles.userMetaText}>
                {user?.userCode ? `MNV: ${user.userCode} • ` : ''}
                {user?.department?.name || 'Toàn công ty'}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              isCheckedIn
                ? styles.statusPillIn
                : isCheckedOut
                ? styles.statusPillOut
                : styles.statusPillIdle,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isCheckedIn
                  ? styles.statusDotIn
                  : isCheckedOut
                  ? styles.statusDotOut
                  : styles.statusDotIdle,
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isCheckedIn
                  ? styles.statusPillTextIn
                  : isCheckedOut
                  ? styles.statusPillTextOut
                  : styles.statusPillTextIdle,
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

        {/* Hero Interactive Attendance Card (White Signature Design with Contour Ripples) */}
        <View style={styles.heroCard}>
          {/* Topographic contour ripples background */}
          <View pointerEvents="none" style={styles.heroTopographicWrapper}>
            <Image
              source={require('../../../assets/topographic-contour-employee-v2.png')}
              style={styles.heroTopographicBg}
              resizeMode="cover"
            />
          </View>

          {/* Top Row: Date Tag & Status Pill */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.dateTagWrap}>
              <Ionicons name="calendar-outline" size={13} color="#0284C7" />
              <Text style={styles.dateTagText}>{fullDateString}</Text>
            </View>

            <View
              style={[
                styles.statusPill,
                isCheckedIn
                  ? styles.statusPillIn
                  : isCheckedOut
                  ? styles.statusPillOut
                  : styles.statusPillIdle,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isCheckedIn
                    ? styles.statusDotIn
                    : isCheckedOut
                    ? styles.statusDotOut
                    : styles.statusDotIdle,
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  isCheckedIn
                    ? styles.statusPillTextIn
                    : isCheckedOut
                    ? styles.statusPillTextOut
                    : styles.statusPillTextIdle,
                ]}
              >
                {isCheckedIn
                  ? 'Đang trong ca'
                  : isCheckedOut
                  ? 'Đã xong ca'
                  : 'Chưa vào ca'}
              </Text>
            </View>
          </View>

          {/* Big Bold Live Time */}
          <View style={styles.clockContainer}>
            <Text style={styles.heroClock}>{timeString}</Text>
          </View>

          {/* Modern High-End Action Button */}
          <Pressable
            onPress={() => {
              if (isCheckedIn) {
                router.push('/employee/attendance/check-out' as any);
              } else {
                router.push('/employee/attendance/check-in' as any);
              }
            }}
            style={({ pressed }) => [
              styles.primaryActionBtn,
              isCheckedIn ? styles.actionBtnOut : styles.actionBtnIn,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
            ]}
          >
            <View
              style={[
                styles.actionIconCircle,
                isCheckedIn ? styles.actionIconCircleOut : styles.actionIconCircleIn,
              ]}
            >
              <Ionicons
                name={isCheckedIn ? 'log-out-outline' : 'finger-print'}
                size={26}
                color={isCheckedIn ? '#EF4444' : '#0284C7'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBtnTitle}>
                {isCheckedIn ? 'ĐIỂM DANH RA CA' : 'ĐIỂM DANH VÀO CA'}
              </Text>
              <Text
                style={[
                  styles.actionBtnSubtitle,
                  { color: isCheckedIn ? '#FEE2E2' : '#E0F2FE' },
                ]}
              >
                {isCheckedIn
                  ? `Đang làm • ${durationDisplay} • Nhấn để ra ca`
                  : 'Nhấn để quét khuôn mặt & xác thực GPS'}
              </Text>
            </View>
            <View style={styles.actionArrowCircle}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Dual Stat Metrics Subcard */}
          <View style={styles.metricsSubCard}>
            {isCheckedIn ? (
              <>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>GIỜ VÀO CA</Text>
                  <View style={styles.metricValueRow}>
                    <Ionicons name="log-in" size={15} color="#0284C7" />
                    <Text style={styles.metricValue}>{checkInTimeDisplay}</Text>
                  </View>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>TỔNG THỜI GIAN</Text>
                  <View style={styles.metricValueRow}>
                    <Ionicons name="time" size={15} color="#10B981" />
                    <Text style={[styles.metricValue, { color: '#059669' }]}>
                      {durationDisplay}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>CA HÔM NAY</Text>
                  <View style={styles.metricValueRow}>
                    <Ionicons name="calendar-outline" size={15} color="#0B3B61" />
                    <Text style={styles.metricValue} numberOfLines={1}>
                      {todayShift?.shift?.name
                        ? `${todayShift.shift.name} (${todayShift.shift.startTime?.substring(0, 5)} - ${todayShift.shift.endTime?.substring(0, 5)})`
                        : 'Chưa có ca'}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>TRẠNG THÁI</Text>
                  <View style={styles.metricValueRow}>
                    <Ionicons
                      name={isCheckedOut ? 'checkmark-circle' : 'time-outline'}
                      size={15}
                      color={isCheckedOut ? '#10B981' : '#D97706'}
                    />
                    <Text
                      style={[
                        styles.metricValue,
                        { color: isCheckedOut ? '#059669' : '#D97706' },
                      ]}
                    >
                      {isCheckedOut ? 'Đã hoàn tất' : 'Chờ điểm danh'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Location details */}
          <View style={styles.locationFooterRow}>
            <Ionicons name="location-sharp" size={14} color="#0284C7" />
            <Text style={styles.locationFooterText} numberOfLines={1}>
              {branchName} • {cleanAddress(branchAddress)}
            </Text>
          </View>
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

        {/* Quick Nav Tools */}
        <View style={styles.toolsGrid}>
          <Pressable
            onPress={() => router.push('/employee/attendance/history' as any)}
            style={({ pressed }) => [styles.toolTile, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="calendar-outline" size={20} color="#0284C7" />
            </View>
            <Text style={styles.toolTitle}>Bảng công</Text>
            <Text style={styles.toolDesc}>Chi tiết theo tháng</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/employee/schedule' as any)}
            style={({ pressed }) => [styles.toolTile, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alarm-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.toolTitle}>Lịch làm việc</Text>
            <Text style={styles.toolDesc}>Xem phân ca tuần</Text>
          </Pressable>
        </View>

        {/* Recent History Section */}
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
              const dateLabel = isToday ? 'Hôm nay' : formatVnShortDate(recordDate);

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
                      {formatVnFullDate(recordDate)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B3B61',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B3B61',
  },
  userMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillIn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusPillOut: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusPillIdle: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotIn: {
    backgroundColor: '#10B981',
  },
  statusDotOut: {
    backgroundColor: '#0284C7',
  },
  statusDotIdle: {
    backgroundColor: '#94A3B8',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextIn: {
    color: '#065F46',
  },
  statusPillTextOut: {
    color: '#0369A1',
  },
  statusPillTextIdle: {
    color: '#475569',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  heroTopographicWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 240,
    height: '100%',
    overflow: 'hidden',
    opacity: 0.9,
  },
  heroTopographicBg: {
    width: '100%',
    height: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dateTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.2,
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  heroClock: {
    fontSize: 44,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  primaryActionBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  actionBtnIn: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  actionBtnOut: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconCircleIn: {
    backgroundColor: '#FFFFFF',
  },
  actionIconCircleOut: {
    backgroundColor: '#FFFFFF',
  },
  actionBtnTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  actionBtnSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  actionArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsSubCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  locationFooterText: {
    fontSize: 11.5,
    color: '#64748B',
    flex: 1,
    fontWeight: '500',
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
  toolsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  toolTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B3B61',
  },
  toolDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
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
    color: '#0B3B61',
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
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyShiftName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B3B61',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#0B3B61',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  historyStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

