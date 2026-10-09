import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import {
  useShifts,
  useMySchedule,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useAssignShift,
  useRevokeShiftAssignment,
} from '../../hooks/useShifts';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useAppAlert } from '../../contexts/AlertContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { businessDateToday, formatDate, formatShiftRange, toIsoDate } from '../../utils/date-time';
import { getRoleBaseRoute, getHomeRouteForUser } from '../../utils/role-routing';
import { normalizeApiError } from '../../utils/api-error';
import { hasPermission } from '../../utils/permissions';
import { findTodayShift } from '../attendance/attendance.logic';

function TimePickerField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  const [show, setShow] = useState(false);
  const date = useMemo(() => {
    const d = new Date();
    const [h, m] = value.split(':');
    if (h && m) {
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    }
    return d;
  }, [value]);

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      const h = selectedDate.getHours().toString().padStart(2, '0');
      const m = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${h}:${m}`);
    }
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <Pressable style={styles.timePickerSelector} onPress={() => setShow(true)}>
        <Text style={styles.timePickerSelectorText}>{value || '--:--'}</Text>
      </Pressable>
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleChange}
        />
      )}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.datePickerModalContainer}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={styles.datePickerCancelText}>Hủy</Text>
                </Pressable>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={styles.datePickerDoneText}>Xong</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={date}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleChange}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '0 giờ';
  const [shStr, smStr] = start.split(':');
  const [ehStr, emStr] = end.split(':');
  const sh = parseInt(shStr || '', 10);
  const sm = parseInt(smStr || '', 10);
  const eh = parseInt(ehStr || '', 10);
  const em = parseInt(emStr || '', 10);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '0 giờ';
  let diffMinutes = eh * 60 + em - (sh * 60 + sm);
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${minutes} phút`;
}

function TimeSelectorBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => {
    const d = new Date();
    const [h, m] = value.split(':');
    if (h && m) {
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    }
    return d;
  });

  const date = useMemo(() => {
    const d = new Date();
    const [h, m] = value.split(':');
    if (h && m) {
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    }
    return d;
  }, [value]);

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selectedDate) {
        const h = selectedDate.getHours().toString().padStart(2, '0');
        const m = selectedDate.getMinutes().toString().padStart(2, '0');
        onChange(`${h}:${m}`);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleDoneIos = () => {
    setShow(false);
    const h = tempDate.getHours().toString().padStart(2, '0');
    const m = tempDate.getMinutes().toString().padStart(2, '0');
    onChange(`${h}:${m}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.modernFieldLabel}>{label}</Text>
      <Pressable
        style={styles.timeSelectorButton}
        onPress={() => {
          setTempDate(date);
          setShow(true);
        }}
      >
        <Ionicons name="time-outline" size={18} color="#0F172A" />
        <Text style={styles.timeSelectorValueText}>{value || '--:--'}</Text>
        <Ionicons name="chevron-down" size={16} color="#64748B" />
      </Pressable>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.datePickerModalContainer}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={styles.datePickerCancelText}>Hủy</Text>
                </Pressable>
                <Pressable onPress={handleDoneIos}>
                  <Text style={styles.datePickerDoneText}>Xong</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleChange}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function getWorkDateDisplay(workDate: string | Date) {
  const formatted = formatDate(workDate);
  if (!formatted || formatted === '-') return { day: '--', month: '--' };
  const parts = formatted.split('/');
  if (parts.length === 3 && parts[0] && parts[1]) {
    return {
      day: parseInt(parts[0], 10),
      month: `Thg ${parseInt(parts[1], 10)}`,
    };
  }
  const d = new Date(workDate);
  return { day: d.getDate(), month: `Thg ${d.getMonth() + 1}` };
}

export function EmployeeScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const schedule = useMySchedule();
  const { showAlert } = useAppAlert();
  const todayIso = businessDateToday();
  const todayDisplay = formatDate(new Date());
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const allAssignments = schedule.data ?? [];

  const todayShift = useMemo(() => findTodayShift(allAssignments, todayIso), [allAssignments, todayIso]);

  const upcomingShifts = useMemo(() => {
    return allAssignments
      .filter((a) => {
        const d = toIsoDate(a.workDate);
        return d > todayIso && a.status !== 'CANCELLED';
      })
      .sort((a, b) => toIsoDate(a.workDate).localeCompare(toIsoDate(b.workDate)));
  }, [allAssignments, todayIso]);

  const pastShifts = useMemo(() => {
    return allAssignments
      .filter((a) => {
        const d = toIsoDate(a.workDate);
        return d < todayIso;
      })
      .sort((a, b) => toIsoDate(b.workDate).localeCompare(toIsoDate(a.workDate)));
  }, [allAssignments, todayIso]);

  const rolePrefix = useMemo(() => getRoleBaseRoute(user), [user]);
  const { data: currentAttendance } = useCurrentAttendance();

  const attendanceRoute = currentAttendance?.state === 'CHECKED_IN'
    ? `${rolePrefix}/attendance/check-out`
    : `${rolePrefix}/attendance/check-in`;

  const displayList = activeTab === 'upcoming' ? upcomingShifts : pastShifts;

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={schedule.isRefetching} onRefresh={() => void schedule.refetch()} />}
      >
        <PageHeader 
          title="Lịch làm việc cá nhân" 
          subtitle={`Hôm nay: ${todayDisplay}`} 
        />
        
        <SectionCard title="Ca làm việc hôm nay">
          {todayShift?.shift ? (
            <Pressable 
              style={styles.todayShiftCard}
              onPress={() => router.push(attendanceRoute as any)}
            >
              <View style={styles.shiftIconBox}>
                <MaterialCommunityIcons name="briefcase-clock-outline" size={28} color={colors.primary} />
              </View>
              <View style={styles.grow}>
                <Text style={styles.shiftTitleText}>{todayShift.shift.name}</Text>
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
                  <Text style={styles.timeText}>{formatDate(todayShift.workDate)} • {formatShiftRange(todayShift.shift.startTime, todayShift.shift.endTime)}</Text>
                </View>
                <View style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                  <StatusBadge label={todayShift.shift.isNightShift ? 'Ca đêm' : 'Ca ngày'} tone={todayShift.shift.isNightShift ? 'warning' : 'success'} />
                </View>
              </View>
              <View style={styles.attendanceActionBox}>
                <MaterialCommunityIcons name="fingerprint" size={24} color={colors.primary} />
                <Text style={styles.attendanceActionText}>
                  {currentAttendance?.state === 'CHECKED_IN' ? 'Ra ca' : 'Chấm công'}
                </Text>
              </View>
            </Pressable>
          ) : (
            <EmptyState 
              title="Không có lịch làm việc" 
              message="Hôm nay bạn không có ca làm việc nào được xếp." 
              icon="calendar-blank-outline"
            />
          )}
        </SectionCard>
        
        <SectionCard title="Tiện ích ca làm việc">
          <View style={styles.utilitiesGrid}>
            <Pressable style={styles.utilityBtn} onPress={() => showAlert('Thông báo', 'Tính năng Đăng ký ca làm việc đang được nâng cấp.')}>
              <View style={[styles.utilityIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="calendar-plus" size={24} color="#10B981" />
              </View>
              <Text style={styles.utilityText}>Đăng ký ca</Text>
            </Pressable>
            
            <Pressable style={styles.utilityBtn} onPress={() => {
              if (rolePrefix === '/leader') {
                showAlert('Thông báo', 'Chức năng đang được phát triển');
              } else {
                router.push(`${rolePrefix}/shift-swaps/create` as any);
              }
            }}>
              <View style={[styles.utilityIconBox, { backgroundColor: '#FFFBEB' }]}>
                <MaterialCommunityIcons name="calendar-sync" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.utilityText}>Đổi ca</Text>
            </Pressable>

            <Pressable style={styles.utilityBtn} onPress={() => router.push(attendanceRoute as any)}>
              <View style={[styles.utilityIconBox, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="fingerprint" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.utilityText}>
                {currentAttendance?.state === 'CHECKED_IN' ? 'Ra ca' : 'Chấm công'}
              </Text>
            </Pressable>
          </View>
        </SectionCard>

        {/* Tab Segment Selector */}
        <View style={styles.scheduleTabRow}>
          <Pressable
            style={[styles.scheduleTabBtn, activeTab === 'upcoming' && styles.scheduleTabBtnActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <MaterialCommunityIcons
              name="calendar-clock"
              size={18}
              color={activeTab === 'upcoming' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.scheduleTabBtnText, activeTab === 'upcoming' && styles.scheduleTabBtnTextActive]}>
              Ca sắp tới ({upcomingShifts.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.scheduleTabBtn, activeTab === 'past' && styles.scheduleTabBtnActive]}
            onPress={() => setActiveTab('past')}
          >
            <MaterialCommunityIcons
              name="history"
              size={18}
              color={activeTab === 'past' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.scheduleTabBtnText, activeTab === 'past' && styles.scheduleTabBtnTextActive]}>
              Lịch sử ca ({pastShifts.length})
            </Text>
          </Pressable>
        </View>

        <SectionCard title={activeTab === 'upcoming' ? `Danh sách ca sắp tới (${upcomingShifts.length})` : `Lịch sử ca làm việc (${pastShifts.length})`}>
          {displayList.length ? displayList.map((assignment) => {
            const dateInfo = getWorkDateDisplay(assignment.workDate);
            return (
              <View key={assignment.id} style={styles.upcomingShiftRow}>
                <View style={[styles.dateBox, activeTab === 'past' && styles.dateBoxPast]}>
                  <Text style={[styles.dateDayText, activeTab === 'past' && styles.dateDayTextPast]}>{dateInfo.day}</Text>
                  <Text style={[styles.dateMonthText, activeTab === 'past' && styles.dateMonthTextPast]}>{dateInfo.month}</Text>
                </View>
                <View style={styles.upcomingShiftInfo}>
                  <Text style={styles.upcomingShiftTitle}>{assignment.shift?.name ?? assignment.shiftId}</Text>
                  <View style={styles.timeRow}>
                    <MaterialCommunityIcons name="timer-outline" size={14} color={colors.muted} />
                    <Text style={styles.timeText}>{formatShiftRange(assignment.shift?.startTime, assignment.shift?.endTime)}</Text>
                  </View>
                </View>
                <View style={styles.statusBox}>
                  <StatusBadge 
                    label={
                      (assignment.status as string) === 'ASSIGNED' || (assignment.status as string) === 'ACTIVE' 
                        ? (activeTab === 'past' ? 'Đã diễn ra' : 'Đã phân ca') 
                        : (assignment.status as string) === 'CANCELLED' 
                        ? 'Đã hủy' 
                        : (assignment.status as string)
                    } 
                    tone={
                      (assignment.status as string) === 'ASSIGNED' || (assignment.status as string) === 'ACTIVE' 
                        ? (activeTab === 'past' ? 'neutral' : 'info') 
                        : (assignment.status as string) === 'CANCELLED' 
                        ? 'danger' 
                        : 'neutral'
                    } 
                  />
                </View>
              </View>
            );
          }) : (
            <EmptyState 
              title={activeTab === 'upcoming' ? 'Chưa có ca sắp tới' : 'Chưa có lịch sử ca'} 
              message={activeTab === 'upcoming' ? 'Bạn hiện chưa có ca làm việc nào được phân trong thời gian tới.' : 'Bạn chưa có ca làm việc nào trong quá khứ.'} 
              icon={activeTab === 'upcoming' ? 'calendar-check-outline' : 'history'}
            />
          )}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function AdminShiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const shifts = useShifts();
  const deleteShift = useDeleteShift();
  const revokeAssignment = useRevokeShiftAssignment();
  const { showAlert, showConfirm } = useAppAlert();

  const handleRevoke = (id: string, name: string) => {
    showConfirm({
      title: 'Thu hồi ca làm',
      message: `Bạn có chắc chắn muốn thu hồi ca phân công của "${name}"?`,
      confirmLabel: 'Thu hồi',
      onConfirm: async () => {
        try {
          await revokeAssignment.mutateAsync(id);
          showAlert('Thành công', 'Đã thu hồi ca làm');
        } catch (error) {
          const normalized = normalizeApiError(error);
          showAlert('Lỗi', normalized.message);
        }
      },
    });
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm({
      title: 'Xóa ca làm việc',
      message: `Bạn có chắc chắn muốn xóa ca "${name}"?\nDữ liệu đã xếp ca cho nhân viên sẽ không bị ảnh hưởng (Xóa mềm).`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteShift.mutateAsync(id);
          showAlert('Thành công', 'Đã xóa ca làm việc');
        } catch (error) {
          const normalized = normalizeApiError(error);
          showAlert('Lỗi', normalized.message);
        }
      },
    });
  };

  const canCreateShift = Boolean(
    user?.roles?.includes('ADMIN') ||
      user?.roles?.includes('SUPER_ADMIN') ||
      user?.roles?.includes('HR') ||
      user?.permissions?.includes('shift.create')
  );

  const canAssignShift = Boolean(
    user?.roles?.includes('ADMIN') ||
      user?.roles?.includes('SUPER_ADMIN') ||
      user?.roles?.includes('HR') ||
      user?.roles?.includes('LEADER') ||
      user?.permissions?.includes('shift.assign')
  );

  const shiftList = shifts.data ?? [];
  const shiftCount = shiftList.length;

  return (
    <View style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* ── Top Header (#1B3B2B) ── */}
      <View style={[styles.modernHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.decorativeCurve} />

        <View style={styles.modernHeaderTopRow}>
          <Pressable
            style={styles.headerBackBtn}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.brandTagline}>MOVIE LEGEND</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.screenTitle}>Ca làm việc</Text>
          <Text style={styles.screenSubtitle}>Quản lý ca trong hệ thống</Text>
        </View>
      </View>

      <ScrollView
        style={styles.modernScroll}
        contentContainerStyle={[
          styles.modernScrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={shifts.isRefetching}
            onRefresh={() => void shifts.refetch()}
            tintColor="#1B3B2B"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Phân ca nhân viên Card ── */}
        {canAssignShift && (
          <Pressable
            style={styles.assignBannerCard}
            onPress={() => router.push('/admin/shifts/assign')}
          >
            <View style={styles.assignIconBox}>
              <MaterialCommunityIcons name="calendar-account-outline" size={24} color="#1B3B2B" />
            </View>
            <View style={styles.assignMetaCol}>
              <Text style={styles.assignTitle}>Phân ca nhân viên</Text>
              <Text style={styles.assignSubtitle}>Sắp xếp ca cho nhân sự</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
        )}

        {/* ── Section Header: Danh sách ca ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Danh sách ca</Text>
          <Text style={styles.sectionCountText}>{shiftCount} ca</Text>
        </View>

        {/* ── Empty State Card (Template 01) ── */}
        {shiftCount === 0 && !shifts.isLoading && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIllustrationWrap}>
              <View style={styles.emptyCircleBg}>
                {/* Accent sparkle rays */}
                <View style={styles.sparkleContainer}>
                  <View style={[styles.sparkleLine, { transform: [{ rotate: '-35deg' }], top: 0, right: 6 }]} />
                  <View style={[styles.sparkleLine, { transform: [{ rotate: '15deg' }], top: 7, right: -2 }]} />
                </View>
                <View style={styles.emptyIconGroup}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={48} color="#1B3B2B" />
                  <View style={styles.emptyClockBadge}>
                    <Ionicons name="time-outline" size={20} color="#1B3B2B" />
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.emptyTitle}>Chưa có ca làm việc</Text>
            <Text style={styles.emptyDesc}>
              Tạo ca đầu tiên để bắt đầu{'\n'}quản lý thời gian làm việc
            </Text>

            {canCreateShift && (
              <Pressable
                style={styles.emptyCreateBtn}
                onPress={() => router.push('/admin/shifts/create')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyCreateBtnText}>Tạo ca mới</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Shifts List (Non-empty state) ── */}
        {shiftCount > 0 && (
          <View style={styles.shiftListWrap}>
            {shiftList.map((shift) => (
              <View key={shift.id} style={styles.modernShiftCard}>
                <View style={styles.shiftCardHeader}>
                  <View style={styles.shiftCardIconBox}>
                    <Ionicons name="time-outline" size={22} color="#1B3B2B" />
                  </View>
                  <View style={styles.shiftCardMetaCol}>
                    <Text style={styles.shiftCardName}>{shift.name}</Text>
                    <Text style={styles.shiftCardCode}>Mã: {shift.code}</Text>
                  </View>
                  <View
                    style={[
                      styles.modernStatusBadge,
                      { backgroundColor: shift.isActive ? '#DCFCE7' : '#F1F5F9' },
                    ]}
                  >
                    <View
                      style={[
                        styles.modernStatusDot,
                        { backgroundColor: shift.isActive ? '#16A34A' : '#94A3B8' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.modernStatusText,
                        { color: shift.isActive ? '#16A34A' : '#64748B' },
                      ]}
                    >
                      {shift.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                    </Text>
                  </View>
                </View>

                {/* Time range banner */}
                <View style={styles.shiftTimeBanner}>
                  <View style={styles.shiftTimeLeft}>
                    <Ionicons name="time-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.shiftTimeRange}>
                      {formatShiftRange(shift.startTime, shift.endTime)}
                    </Text>
                  </View>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationBadgeText}>
                      {calculateDuration(shift.startTime, shift.endTime)}
                    </Text>
                  </View>
                </View>

                {/* Assigned employees if any */}
                {(shift as any).assignments && (shift as any).assignments.length > 0 && (() => {
                  const rawAssignments: any[] = (shift as any).assignments;
                  const uniqueAssignments = rawAssignments.filter(
                    (a: any, index: number, self: any[]) =>
                      index === self.findIndex((t: any) => t.userId === a.userId)
                  );

                  if (uniqueAssignments.length === 0) return null;

                  return (
                    <View style={styles.assignmentSection}>
                      <View style={styles.assignmentHeader}>
                        <MaterialCommunityIcons name="account-group-outline" size={16} color="#1B3B2B" />
                        <Text style={styles.assignmentLabel}>Nhân sự đã phân ca</Text>
                        <View style={styles.assignmentCount}>
                          <Text style={styles.assignmentCountText}>{uniqueAssignments.length}</Text>
                        </View>
                      </View>
                      <View style={styles.assignmentList}>
                        {uniqueAssignments.map((a: any) => {
                          const name = a.user?.profile?.fullName ?? a.user?.userCode ?? '?';
                          const initials = name
                            .split(' ')
                            .filter(Boolean)
                            .slice(-2)
                            .map((w: string) => w[0])
                            .join('')
                            .toUpperCase();
                          return (
                            <Pressable
                              key={a.id}
                              style={styles.assignmentChip}
                              onLongPress={() => handleRevoke(a.id, name)}
                              delayLongPress={300}
                            >
                              <View style={styles.assignmentAvatar}>
                                <Text style={styles.assignmentAvatarText}>{initials}</Text>
                              </View>
                              <Text style={styles.assignmentName}>{name}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                {/* Actions: Edit / Delete */}
                <View style={styles.shiftCardActions}>
                  <Pressable
                    style={styles.shiftEditBtn}
                    onPress={() => router.push(`/admin/shifts/edit/${shift.id}`)}
                  >
                    <Ionicons name="create-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                    <Text style={styles.shiftEditBtnText}>Sửa</Text>
                  </Pressable>

                  <Pressable
                    style={styles.shiftDeleteBtn}
                    onPress={() => handleDelete(shift.id, shift.name)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#B91C1C" style={{ marginRight: 6 }} />
                    <Text style={styles.shiftDeleteBtnText}>Xóa</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {canCreateShift && (
              <Pressable
                style={styles.listBottomCreateBtn}
                onPress={() => router.push('/admin/shifts/create')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.listBottomCreateBtnText}>Tạo ca mới</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function CreateShiftScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createShift = useCreateShift();
  const { showAlert } = useAppAlert();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const isValid = Boolean(code.trim() && name.trim());

  async function submit() {
    if (!isValid) return;
    try {
      await createShift.mutateAsync({ code: code.trim(), name: name.trim(), startTime, endTime });
      showAlert('Thành công', 'Đã tạo ca làm việc mới', () => router.back());
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    }
  }

  return (
    <View style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* ── Top Header (#1B3B2B) ── */}
      <View style={[styles.modernHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.decorativeCurve} />

        <View style={styles.modernHeaderTopRow}>
          <Pressable
            style={styles.headerBackBtn}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.brandTagline}>MOVIE LEGEND</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.screenTitle}>Tạo ca làm việc</Text>
          <Text style={styles.screenSubtitle}>Thiết lập thông tin và khung giờ</Text>
        </View>
      </View>

      <ScrollView
        style={styles.modernScroll}
        contentContainerStyle={[
          styles.modernScrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Thông tin ca */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <View style={styles.formCardIconBox}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#1B3B2B" />
            </View>
            <Text style={styles.formCardTitle}>Thông tin ca</Text>
          </View>

          <Text style={styles.modernFieldLabel}>Mã ca</Text>
          <TextInput
            style={styles.modernTextInput}
            value={code}
            onChangeText={setCode}
            placeholder="VD: CA1"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />

          <Text style={[styles.modernFieldLabel, { marginTop: 14 }]}>Tên ca</Text>
          <TextInput
            style={styles.modernTextInput}
            value={name}
            onChangeText={setName}
            placeholder="VD: Ca sáng"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Card 2: Thời gian làm việc */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <View style={styles.formCardIconBox}>
              <Ionicons name="time-outline" size={20} color="#1B3B2B" />
            </View>
            <Text style={styles.formCardTitle}>Thời gian làm việc</Text>
          </View>

          <View style={styles.timeRangePickerRow}>
            <TimeSelectorBox label="Bắt đầu" value={startTime} onChange={setStartTime} />
            <View style={styles.timeArrowDivider}>
              <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
            </View>
            <TimeSelectorBox label="Kết thúc" value={endTime} onChange={setEndTime} />
          </View>

          {/* Duration info banner */}
          <View style={styles.durationInfoBox}>
            <View style={styles.durationIconCircle}>
              <Ionicons name="time-outline" size={18} color="#1B3B2B" />
            </View>
            <View style={styles.durationTextCol}>
              <Text style={styles.durationMainText}>
                Khoảng thời gian: {calculateDuration(startTime, endTime)}
              </Text>
              <Text style={styles.durationSubText}>Chưa trừ thời gian nghỉ</Text>
            </View>
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.formFooterWrap}>
          {!isValid && (
            <Text style={styles.footerValidationHint}>Nhập mã ca và tên ca để tiếp tục.</Text>
          )}

          <View style={styles.footerButtonsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitBtn,
                isValid ? styles.submitBtnActive : styles.submitBtnDisabled,
              ]}
              disabled={!isValid || createShift.isPending}
              onPress={() => void submit()}
            >
              {createShift.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitBtnText,
                    isValid ? styles.submitBtnTextActive : styles.submitBtnTextDisabled,
                  ]}
                >
                  Tạo ca mới
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function EditShiftScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shifts = useShifts();
  const updateShift = useUpdateShift(id as string);
  const { showAlert } = useAppAlert();

  const shift = useMemo(() => (shifts.data ?? []).find((s) => s.id === id), [shifts.data, id]);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (shift) {
      setCode(shift.code);
      setName(shift.name);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
    }
  }, [shift]);

  const isValid = Boolean(code.trim() && name.trim());

  async function submit() {
    if (!isValid) return;
    try {
      await updateShift.mutateAsync({ code: code.trim(), name: name.trim(), startTime, endTime });
      showAlert('Thành công', 'Đã cập nhật ca làm việc', () => router.back());
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    }
  }

  if (!shift) {
    return (
      <Screen>
        <EmptyState
          title="Không tìm thấy ca làm việc"
          message="Ca làm việc không tồn tại hoặc đã bị xóa."
        />
      </Screen>
    );
  }

  return (
    <View style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* ── Top Header (#1B3B2B) ── */}
      <View style={[styles.modernHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.decorativeCurve} />

        <View style={styles.modernHeaderTopRow}>
          <Pressable
            style={styles.headerBackBtn}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.brandTagline}>MOVIE LEGEND</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.screenTitle}>Cập nhật ca làm việc</Text>
          <Text style={styles.screenSubtitle}>Thiết lập thông tin và khung giờ</Text>
        </View>
      </View>

      <ScrollView
        style={styles.modernScroll}
        contentContainerStyle={[
          styles.modernScrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Thông tin ca */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <View style={styles.formCardIconBox}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#1B3B2B" />
            </View>
            <Text style={styles.formCardTitle}>Thông tin ca</Text>
          </View>

          <Text style={styles.modernFieldLabel}>Mã ca</Text>
          <TextInput
            style={styles.modernTextInput}
            value={code}
            onChangeText={setCode}
            placeholder="VD: CA1"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />

          <Text style={[styles.modernFieldLabel, { marginTop: 14 }]}>Tên ca</Text>
          <TextInput
            style={styles.modernTextInput}
            value={name}
            onChangeText={setName}
            placeholder="VD: Ca sáng"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Card 2: Thời gian làm việc */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <View style={styles.formCardIconBox}>
              <Ionicons name="time-outline" size={20} color="#1B3B2B" />
            </View>
            <Text style={styles.formCardTitle}>Thời gian làm việc</Text>
          </View>

          <View style={styles.timeRangePickerRow}>
            <TimeSelectorBox label="Bắt đầu" value={startTime} onChange={setStartTime} />
            <View style={styles.timeArrowDivider}>
              <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
            </View>
            <TimeSelectorBox label="Kết thúc" value={endTime} onChange={setEndTime} />
          </View>

          {/* Duration info banner */}
          <View style={styles.durationInfoBox}>
            <View style={styles.durationIconCircle}>
              <Ionicons name="time-outline" size={18} color="#1B3B2B" />
            </View>
            <View style={styles.durationTextCol}>
              <Text style={styles.durationMainText}>
                Khoảng thời gian: {calculateDuration(startTime, endTime)}
              </Text>
              <Text style={styles.durationSubText}>Chưa trừ thời gian nghỉ</Text>
            </View>
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.formFooterWrap}>
          <View style={styles.footerButtonsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitBtn,
                isValid ? styles.submitBtnActive : styles.submitBtnDisabled,
              ]}
              disabled={!isValid || updateShift.isPending}
              onPress={() => void submit()}
            >
              {updateShift.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitBtnText,
                    isValid ? styles.submitBtnTextActive : styles.submitBtnTextDisabled,
                  ]}
                >
                  Lưu thay đổi
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function LeaderShiftManagementScreen() {
  const assign = useAssignShift();
  const shifts = useShifts();
  const { showAlert } = useAppAlert();
  const [userId, setUserId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [workDate, setWorkDate] = useState(businessDateToday());

  async function submit() {
    try {
      await assign.mutateAsync({ userId, departmentId, shiftId, workDate });
      showAlert('Thanh cong', 'Da phan ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={shifts.isRefetching} onRefresh={() => void shifts.refetch()} />}
      >
        <PageHeader title="Phan ca" subtitle="Backend se validate department scope cua Leader/Admin." />
        <SectionCard title="Ca co san">
          {(shifts.data ?? []).map((shift) => <Text key={shift.id} style={styles.text}>{shift.name}: {shift.id}</Text>)}
          {!shifts.data?.length ? <EmptyState /> : null}
        </SectionCard>
        <SectionCard title="Thong tin phan ca">
          <FormField label="User ID" value={userId} onChangeText={setUserId} autoCapitalize="none" />
          <FormField label="Department ID" value={departmentId} onChangeText={setDepartmentId} autoCapitalize="none" />
          <FormField label="Shift ID" value={shiftId} onChangeText={setShiftId} autoCapitalize="none" />
          <FormField label="Work date YYYY-MM-DD" value={workDate} onChangeText={setWorkDate} />
          <PrimaryButton loading={assign.isPending} disabled={!userId || !departmentId || !shiftId || !workDate} onPress={() => void submit()}>Phan ca</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}



const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  grow: {
    flex: 1,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  shiftList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shiftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  shiftCode: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  shiftTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: 6,
  },
  shiftTimeText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  shiftActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  assignmentSection: {
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  assignmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  assignmentCount: {
    backgroundColor: '#F3F4F6',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  assignmentCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  assignmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  assignmentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  assignmentName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
  },
  statusText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  todayShiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: colors.muted,
  },
  attendanceActionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  attendanceActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  upcomingShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateBox: {
    width: 50,
    height: 50,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dateBoxPast: {
    backgroundColor: '#F1F5F9',
  },
  dateDayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284C7',
  },
  dateDayTextPast: {
    color: '#64748B',
  },
  dateMonthText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0284C7',
  },
  dateMonthTextPast: {
    color: '#94A3B8',
  },
  scheduleTabRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.xs,
  },
  scheduleTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scheduleTabBtnActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  scheduleTabBtnTextActive: {
    color: '#FFFFFF',
  },
  upcomingShiftInfo: {
    flex: 1,
  },
  upcomingShiftTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statusBox: {
    marginLeft: spacing.sm,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  utilityBtn: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  utilityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  utilityText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  timePickerSelector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  timePickerSelectorText: {
    fontSize: 15,
    color: colors.text,
  },
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerCancelText: {
    color: colors.muted,
    fontSize: 16,
  },
  datePickerDoneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  iosDatePicker: {
    height: 200,
  },

  /* ── Modern Shift Screen Shared Styles (Template) ── */
  modernContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modernHeader: {
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 16,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCurve: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modernHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
  },
  headerTitleWrap: {
    marginTop: 2,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  modernScroll: {
    flex: 1,
  },
  modernScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* ── Phân ca Banner Card ── */
  assignBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  assignIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assignMetaCol: {
    flex: 1,
  },
  assignTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  assignSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  /* ── Section Header ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCountText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  /* ── Empty Card (Screen 01) ── */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIllustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  emptyCircleBg: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
  },
  sparkleLine: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1B3B2B',
  },
  emptyIconGroup: {
    position: 'relative',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyClockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B3B2B',
    height: 48,
    borderRadius: 12,
    width: '100%',
  },
  emptyCreateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Modern Shift Card List (Screen 01 non-empty) ── */
  shiftListWrap: {
    gap: 12,
  },
  modernShiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shiftCardMetaCol: {
    flex: 1,
  },
  shiftCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftCardCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shiftTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  shiftTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftTimeRange: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  durationBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  shiftCardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  shiftEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  shiftEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  shiftDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  listBottomCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B3B2B',
    height: 48,
    borderRadius: 12,
    marginTop: 8,
  },
  listBottomCreateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Form Card (Screen 02 Tạo ca mới) ── */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  formCardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  formCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modernFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  modernTextInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },

  /* ── Time Pickers Row (Screen 02) ── */
  timeRangePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSelectorButton: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSelectorValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeArrowDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingHorizontal: 8,
  },

  /* ── Duration Info Banner (Screen 02) ── */
  durationInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  durationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(27, 59, 43, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  durationTextCol: {
    flex: 1,
  },
  durationMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  durationSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  /* ── Form Bottom Footer (Screen 02) ── */
  formFooterWrap: {
    marginTop: 8,
    marginBottom: 16,
  },
  footerValidationHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: '#1B3B2B',
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtnTextActive: {
    color: '#FFFFFF',
  },
  submitBtnTextDisabled: {
    color: '#FFFFFF',
  },
});
