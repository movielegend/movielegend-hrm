
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useMemo, useState, useCallback, type ComponentType } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {ScrollView, StyleSheet, Text, View, TouchableWithoutFeedback, RefreshControl, StatusBar, Platform} from 'react-native';

import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';

import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../providers/AuthProvider';
import { queryKeys } from '../../constants/queryKeys';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { LoadingState } from '../../components/LoadingState';
import { useActiveAttendanceLocations, useAttendanceDetail, useAttendanceHistory, useAttendanceReport, useAttendanceDashboardStats, useCheckIn, useCheckOut,
  useCreateAttendanceAdjustment,
  useCreateAttendanceLocation,
  useCurrentAttendance,
  useUpdateAttendanceLocation,
  useDeleteAttendanceLocation,
} from '../../hooks/useAttendance';
import { assertSocketUrl } from '../../constants/env';

function getAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${assertSocketUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

import { useMySchedule } from '../../hooks/useShifts';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AttendanceDetail, AttendanceRecord } from '../../types/attendance.types';
import { businessDateToday, formatDate, formatDateTime, formatDurationMinutes, formatShiftRange, minutesBetween, formatDateYYYYMMDD, parseDateYYYYMMDD } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';
import { AttendanceMap as RawAttendanceMap } from '../location/AttendanceMap';
import { LocationStatusCard } from '../location/LocationStatusCard';
import { useCurrentLocation } from '../location/useCurrentLocation';
import { AttendanceCamera } from './AttendanceCamera';
import { findTodayShift, mapAttendanceError, shouldRecoverAttendanceState } from './attendance.logic';

interface AttendanceMapProps {
  currentLocation: unknown;
  targetLocation?: unknown;
  radius?: number | null;
  loading?: boolean;
  error?: string | null;
}

const AttendanceMap = RawAttendanceMap as ComponentType<AttendanceMapProps>;

export { AttendanceHomeScreen } from './AttendanceHomeScreen';

export function AttendanceCheckInScreen() {
  const queryClient = useQueryClient();
  const locationState = useCurrentLocation();
  const mutation = useCheckIn();
  const schedule = useMySchedule();
  const history = useAttendanceHistory();
  const locations = useActiveAttendanceLocations();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const todayShift = useMemo(() => findTodayShift(schedule.data ?? []), [schedule.data]);
  const targetLocation = locations.data?.[0] ?? null;

  async function submit() {
    const location = locationState.location ?? await locationState.requestLocation();
    if (!location) return;
    if (!photoUri) {
      CustomAlert.alert('Thieu anh', 'Hay chup anh cham cong truoc khi check-in.');
      return;
    }
    try {
      setUploading(true);
      const uploaded = uploadedFileId
        ? { fileId: uploadedFileId }
        : await uploadFile({ uri: photoUri, name: `attendance-${Date.now()}.jpg`, mimeType: 'image/jpeg', purpose: 'ATTENDANCE' });
      setUploadedFileId(uploaded.fileId);
      await mutation.mutateAsync({
        workDate: businessDateToday(),
        latitude: location.latitude,
        longitude: location.longitude,
        ...(typeof location.accuracy === 'number' ? { accuracy: location.accuracy } : {}),
        photoFileId: uploaded.fileId,
      });
      CustomAlert.alert('Thanh cong', 'Da check-in');
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert(normalized.code, mapAttendanceError(normalized.code, normalized.message));
      if (shouldRecoverAttendanceState(normalized.code)) {
        await Promise.all([
          history.refetch(),
          queryClient.invalidateQueries({ queryKey: queryKeys.attendanceCurrent() }),
        ]);
      }
    } finally {
      setUploading(false);
    }
  }

  if (schedule.isLoading || locations.isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={{ marginTop: 12, color: '#98A0A8' }}>Đang tải lịch làm việc...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Vao ca" subtitle={todayShift?.shift ? `${todayShift.shift.name} ${formatShiftRange(todayShift.shift.startTime, todayShift.shift.endTime)}` : 'Can co ca hom nay'} />
        <LocationStatusCard {...locationState} />
        <SecondaryButton loading={locationState.loading} onPress={() => void locationState.requestLocation()}>Lay GPS hien tai</SecondaryButton>
        <SectionCard title="Ban do">
          <AttendanceMap currentLocation={locationState.location} targetLocation={targetLocation} radius={targetLocation?.radiusMeters ?? null} loading={locationState.loading || locations.isLoading} error={locationState.error} />
          <Text style={styles.muted}>Map hien target tu /attendance/locations/active; backend van validate GPS cuoi cung.</Text>
        </SectionCard>
        <AttendanceCamera photoUri={photoUri} onCapture={(uri) => setPhotoUri(uri || null)} />
        <PrimaryButton loading={mutation.isPending || uploading} disabled={!todayShift || mutation.isPending || uploading} onPress={() => void submit()}>Gui check-in</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

export function AttendanceCheckOutScreen() {
  const queryClient = useQueryClient();
  const locationState = useCurrentLocation();
  const mutation = useCheckOut();
  const history = useAttendanceHistory();

  async function submit() {
    const location = locationState.location ?? await locationState.requestLocation();
    if (!location) return;
    try {
      await mutation.mutateAsync({ latitude: location.latitude, longitude: location.longitude });
      CustomAlert.alert('Thanh cong', 'Da checkout');
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert(normalized.code, mapAttendanceError(normalized.code, normalized.message));
      if (shouldRecoverAttendanceState(normalized.code)) {
        await Promise.all([
          history.refetch(),
          queryClient.invalidateQueries({ queryKey: queryKeys.attendanceCurrent() }),
        ]);
      }
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tan ca" subtitle="Backend DTO checkout hien chi nhan GPS, khong co photo field." />
        <LocationStatusCard {...locationState} />
        <SecondaryButton loading={locationState.loading} onPress={() => void locationState.requestLocation()}>Lay GPS hien tai</SecondaryButton>
        <AttendanceMap currentLocation={locationState.location} loading={locationState.loading} error={locationState.error} />
        <PrimaryButton loading={mutation.isPending} disabled={mutation.isPending} onPress={() => void submit()}>Gui checkout</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

const VN_DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function getVnDayString(d: Date): string {
  const dayName = VN_DAYS[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
}

function getVnShortDateString(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function AttendanceHistoryScreen() {
  const router = useRouter();
  const segments = useSegments();
  const basePath = segments[0] === 'leader' ? '/leader' : segments[0] === 'hr' ? '/hr' : segments[0] === 'admin' ? '/admin' : '/employee';

  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const history = useAttendanceHistory({ page: 1, limit: 100 });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  // Calendar matrix calculations
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();

  // Shift Sunday (0) to end of week (Monday=0, Sunday=6) for standard VN calendar (T2 -> CN)
  const startingOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Map attendance items by YYYY-MM-DD
  const attendanceMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (history.data?.items) {
      history.data.items.forEach((item: any) => {
        if (item.workDate) {
          const key = new Date(item.workDate).toISOString().split('T')[0];
          if (key) {
            map[key] = item;
          }
        }
      });
    }
    return map;
  }, [history.data?.items]);

  // Determine initial selected day (if today is in the current month, or first day with record, or day 1)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date();
    if (today.getMonth() + 1 === month && today.getFullYear() === year) {
      return today.getDate();
    }
    return 1;
  });

  // Handle Month Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  // Selected date key and object
  const validSelectedDay = Math.min(selectedDay, daysInMonth);
  const selectedDateKey = useMemo(() => {
    const dStr = validSelectedDay < 10 ? `0${validSelectedDay}` : validSelectedDay;
    const mStr = month < 10 ? `0${month}` : month;
    return `${year}-${mStr}-${dStr}`;
  }, [validSelectedDay, month, year]);

  const selectedRecord = useMemo(() => {
    return attendanceMap[selectedDateKey] || null;
  }, [attendanceMap, selectedDateKey]);

  const selectedDateObj = useMemo(() => {
    return new Date(year, month - 1, validSelectedDay);
  }, [year, month, validSelectedDay]);

  const selectedDayTitle = useMemo(() => {
    return getVnDayString(selectedDateObj);
  }, [selectedDateObj]);

  const selectedFormattedDateStr = useMemo(() => {
    return getVnShortDateString(selectedDateObj);
  }, [selectedDateObj]);

  // Status and details for the selected record
  const checkInDisplayTime = selectedRecord?.checkInAt
    ? new Date(selectedRecord.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const checkOutDisplayTime = selectedRecord?.checkOutAt
    ? new Date(selectedRecord.checkOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const shiftTitle = selectedRecord?.shiftAssignment?.shift?.name || 'Ca làm việc';

  const hasIn = Boolean(selectedRecord?.checkInAt);
  const hasOut = Boolean(selectedRecord?.checkOutAt);

  let badgeText = 'Nghỉ / Trống';
  let badgeColor = '#64748B';
  let badgeBg = '#F1F5F9';
  let badgeBorder = '#E2E8F0';
  let isAlertBadge = false;
  let isCompleteBadge = false;
  let warningMessage: string | null = null;

  if (selectedRecord) {
    if (hasIn && hasOut) {
      badgeText = 'Hoàn tất';
      badgeColor = '#065F46';
      badgeBg = '#ECFDF5';
      badgeBorder = '#A7F3D0';
      isCompleteBadge = true;
    } else if (hasIn && !hasOut) {
      badgeText = 'Thiếu check-out';
      badgeColor = '#EA580C';
      badgeBg = '#FFF7ED';
      badgeBorder = '#FED7AA';
      isAlertBadge = true;
      warningMessage = 'Chưa ghi nhận giờ check-out';
    } else if (!hasIn && hasOut) {
      badgeText = 'Thiếu check-in';
      badgeColor = '#EA580C';
      badgeBg = '#FFF7ED';
      badgeBorder = '#FED7AA';
      isAlertBadge = true;
      warningMessage = 'Chưa ghi nhận giờ check-in';
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F6FA' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Header - Horizontally aligned with back chevron */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, paddingTop: 4 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 8, marginTop: 2 }} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color="#0F172A" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>Lịch sử chấm công</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 3, fontWeight: '500' }}>Theo dõi giờ vào và giờ ra</Text>
          </View>
        </View>

        {/* Calendar Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1, marginBottom: 20 }}>
          {/* Month Selector */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Pressable onPress={prevMonth} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="chevron-back" size={18} color="#0F172A" />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              Tháng {month < 10 ? `0${month}` : month}, {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Weekdays */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <Text key={idx} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: idx >= 5 ? '#EF4444' : '#64748B' }}>
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: startingOffset }).map((_, idx) => (
              <View key={`empty-${idx}`} style={{ width: '14.28%', height: 46 }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = `${year}-${month < 10 ? `0${month}` : month}-${dayNum < 10 ? `0${dayNum}` : dayNum}`;
              const record = attendanceMap[dateKey];
              const isSelected = validSelectedDay === dayNum;
              const colIdx = (startingOffset + idx) % 7;
              const isWeekend = colIdx >= 5;

              const recIn = Boolean(record?.checkInAt);
              const recOut = Boolean(record?.checkOutAt);
              const isIncomplete = (recIn && !recOut) || (!recIn && recOut);

              return (
                <Pressable
                  key={`day-${dayNum}`}
                  onPress={() => setSelectedDay(dayNum)}
                  style={{ width: '14.28%', height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 44,
                      borderRadius: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isSelected ? '#102739' : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isSelected ? '800' : '600',
                        color: isSelected ? '#FFFFFF' : isWeekend ? '#EF4444' : '#0F172A',
                      }}
                    >
                      {dayNum}
                    </Text>

                    {/* Alert dot badge with ! when selected and incomplete */}
                    {isSelected && isIncomplete && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: '#F59E0B',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', lineHeight: 11 }}>!</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Status Legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Hoàn tất</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
              <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Thiếu In/Out</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8FA0B4' }} />
              <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Nghỉ / Trống</Text>
            </View>
          </View>
        </View>

        {/* Section: Chi tiết ngày */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Chi tiết ngày</Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{selectedFormattedDateStr}</Text>
        </View>

        {/* Day Detail Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
          {/* Card Header Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{selectedDayTitle}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{shiftTitle}</Text>
              </View>
            </View>

            {/* Badge on Right */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: badgeBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: badgeBorder }}>
              {isAlertBadge ? (
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#EA580C', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', lineHeight: 11 }}>!</Text>
                </View>
              ) : isCompleteBadge ? (
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              ) : null}
              <Text style={{ fontSize: 11, fontWeight: '700', color: badgeColor }}>{badgeText}</Text>
            </View>
          </View>

          {/* Comparison Box (Check-in & Check-out) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginTop: 14 }}>
            {/* Check-in */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="log-in-outline" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Check-in</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>{checkInDisplayTime}</Text>
              </View>
            </View>

            <View style={{ width: 1, height: 36, backgroundColor: '#E2E8F0', marginHorizontal: 10 }} />

            {/* Check-out */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="log-out-outline" size={20} color="#EA580C" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Check-out</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>{checkOutDisplayTime}</Text>
              </View>
            </View>
          </View>

          {/* Warning Banner */}
          {warningMessage ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#D97706', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900', lineHeight: 13 }}>!</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#B45309', flex: 1 }}>{warningMessage}</Text>
            </View>
          ) : null}

          {/* Button "Xem chi tiết" */}
          <Pressable
            onPress={() => {
              if (selectedRecord?.id) {
                router.push(`${basePath}/attendance/${selectedRecord.id}` as any);
              } else {
                CustomAlert.alert('Thông báo', 'Chưa có dữ liệu chấm công cho ngày này');
              }
            }}
            style={{
              backgroundColor: '#102739',
              borderRadius: 14,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 16,
              position: 'relative',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Xem chi tiết</Text>
            <View style={{ position: 'absolute', right: 18 }}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AttendanceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useAttendanceDetail(id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#102739' }}>
        <StatusBar barStyle="light-content" backgroundColor="#102739" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingState />
        </View>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: '#102739' }}>
        <StatusBar barStyle="light-content" backgroundColor="#102739" />
        <View style={{ paddingTop: Math.max(insets.top, 16) + 4, paddingHorizontal: 16, paddingBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginLeft: -4 }} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={{ flex: 1, backgroundColor: '#F3F6FA', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
          <EmptyState title="Không tìm thấy chi tiết chấm công" />
        </View>
      </View>
    );
  }

  const user = (detail as any).user;
  const name = user?.profile?.fullName || user?.fullName || user?.userCode || 'Nhân viên';
  const role = user?.profile?.role || (user?.roles && user.roles[0]) || 'Nhân viên';
  const avatarUrl = user?.profile?.avatarUrl || user?.avatarUrl;

  const dateObj = new Date(detail.workDate || detail.checkInAt);
  const formattedDateStr = getVnDayString(dateObj);

  const checkInTime = detail.checkInAt
    ? new Date(detail.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;
  const checkOutTime = detail.checkOutAt
    ? new Date(detail.checkOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const hasIn = Boolean(detail.checkInAt);
  const hasOut = Boolean(detail.checkOutAt);

  // Status Badge
  let badgeText = 'Hoàn tất';
  let badgeColor = '#065F46';
  let badgeBg = '#ECFDF5';
  let badgeBorder = '#A7F3D0';
  let isAlertBadge = false;
  let isCompleteBadge = true;

  if (!hasOut && hasIn) {
    badgeText = 'Thiếu check-out';
    badgeColor = '#EA580C';
    badgeBg = '#FFF7ED';
    badgeBorder = '#FED7AA';
    isAlertBadge = true;
    isCompleteBadge = false;
  } else if (!hasIn && hasOut) {
    badgeText = 'Thiếu check-in';
    badgeColor = '#EA580C';
    badgeBg = '#FFF7ED';
    badgeBorder = '#FED7AA';
    isAlertBadge = true;
    isCompleteBadge = false;
  }

  // Location info
  const gps = (detail as any).gps;
  const checkInLat = gps?.checkInLatitude;
  const checkInLng = gps?.checkInLongitude;
  const locationName = gps?.attendanceLocation?.name;
  const coordsStr = locationName || (checkInLat && checkInLng ? `${checkInLat}, ${checkInLng}` : '21.0230134, 105.8390061');

  const checkOutLat = gps?.checkOutLatitude;
  const checkOutLng = gps?.checkOutLongitude;
  const checkOutCoordsStr = locationName || (checkOutLat && checkOutLng ? `${checkOutLat}, ${checkOutLng}` : coordsStr);

  const photoUrl = getAbsoluteImageUrl((detail as any).photo?.fileUrl);
  const checkOutPhotoUrl = getAbsoluteImageUrl((detail as any).checkOutPhoto?.fileUrl);

  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);

  return (
    <View style={{ flex: 1, backgroundColor: '#102739' }}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Top Header (#102739) */}
      <View style={{ paddingTop: safeTopInset + 6, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 }}>Chi tiết Check-in</Text>
      </View>

      {/* Main Curved Body */}
      <View style={{ flex: 1, backgroundColor: '#F3F6FA', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* 1. User Info Card */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={name} uri={avatarUrl} size={58} />

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 16.5, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{name}</Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' }}>{role}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>{formattedDateStr}</Text>
                </View>
              </View>

              {/* Status Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: badgeBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: badgeBorder }}>
                {isAlertBadge ? (
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#EA580C', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', lineHeight: 11 }}>!</Text>
                  </View>
                ) : isCompleteBadge ? (
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                ) : null}
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: badgeColor }}>{badgeText}</Text>
              </View>
            </View>
          </View>

          {/* 2. Section Heading */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Ionicons name="list-outline" size={22} color="#0F172A" />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Nhật ký chấm công</Text>
          </View>

          {/* 3. Timeline Items */}
          {/* Step 1: CHECK-IN */}
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
            {/* Timeline Left Column */}
            <View style={{ width: 20, alignItems: 'center' }}>
              {/* Top Node: Bullseye #102739 */}
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#102739', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#102739' }} />
              </View>
              {/* Connecting Line to next node */}
              <View style={{ width: 1.5, flex: 1, backgroundColor: '#CBD5E1', marginTop: 4, marginBottom: -20 }} />
            </View>

            {/* Check-in Card */}
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
              {/* Row 1: Time */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={22} color="#2563EB" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Check-in</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>{checkInTime || '--:--'}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 }} />

              {/* Row 2: Location */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={22} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Tọa độ ghi nhận</Text>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#0F172A', marginTop: 2 }}>{coordsStr}</Text>
                </View>
              </View>

              {/* Row 3: Photo */}
              {photoUrl ? (
                <>
                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="image-outline" size={22} color="#2563EB" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Ảnh check-in</Text>
                  </View>

                  <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', width: '100%' }}>
                    <Pressable onPress={() => setSelectedImage(photoUrl)}>
                      <Image source={{ uri: photoUrl }} style={{ width: '100%', height: 320, borderRadius: 16, backgroundColor: '#F1F5F9' }} resizeMode="cover" />
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedImage(photoUrl)}
                      style={{ position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center' }}
                      hitSlop={8}
                    >
                      <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* Step 2: CHECK-OUT */}
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {/* Timeline Left Column */}
            <View style={{ width: 20, alignItems: 'center' }}>
              {/* Node: Orange hollow circle if missing, Green if complete */}
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: checkOutTime ? '#10B981' : '#EA580C', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                {checkOutTime ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} /> : null}
              </View>
            </View>

            {/* Check-out Card */}
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
              {checkOutTime ? (
                <>
                  {/* Row 1: Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="time-outline" size={22} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Check-out</Text>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>{checkOutTime}</Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 }} />

                  {/* Row 2: Location */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={22} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Tọa độ ghi nhận</Text>
                      <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#0F172A', marginTop: 2 }}>{checkOutCoordsStr || coordsStr}</Text>
                    </View>
                  </View>

                  {/* Row 3: Photo */}
                  {checkOutPhotoUrl ? (
                    <>
                      <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="image-outline" size={22} color="#2563EB" />
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Ảnh check-out</Text>
                      </View>

                      <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', width: '100%' }}>
                        <Pressable onPress={() => setSelectedImage(checkOutPhotoUrl)}>
                          <Image source={{ uri: checkOutPhotoUrl }} style={{ width: '100%', height: 320, borderRadius: 16, backgroundColor: '#F1F5F9' }} resizeMode="cover" />
                        </Pressable>
                        <Pressable
                          onPress={() => setSelectedImage(checkOutPhotoUrl)}
                          style={{ position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center' }}
                          hitSlop={8}
                        >
                          <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </>
              ) : (
                /* Missing Check-out Row matching template */
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={22} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Check-out</Text>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>Chưa ghi nhận</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <Pressable style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </Pressable>
            <Image source={{ uri: selectedImage }} style={{ width: '90%', height: '80%', resizeMode: 'contain' }} />
          </View>
        </Modal>
      )}
    </View>
  );
}

export function AttendanceAdjustmentScreen() {
  const params = useLocalSearchParams<{ attendanceRecordId?: string }>();
  const mutation = useCreateAttendanceAdjustment();
  const [attendanceRecordId, setAttendanceRecordId] = useState(params.attendanceRecordId ?? '');
  const [requestedCheckInAt, setRequestedCheckInAt] = useState('');
  const [requestedCheckOutAt, setRequestedCheckOutAt] = useState('');
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({
        ...(attendanceRecordId ? { attendanceRecordId } : {}),
        ...(requestedCheckInAt ? { requestedCheckInAt } : {}),
        ...(requestedCheckOutAt ? { requestedCheckOutAt } : {}),
        reason,
      });
      CustomAlert.alert('Thanh cong', 'Da gui yeu cau dieu chinh cong');
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Dieu chinh cong" subtitle="Employee chi tao request cho ban ghi cua minh; backend enforce owner." />
        <SectionCard>
          <FormField label="Attendance record ID" value={attendanceRecordId} onChangeText={setAttendanceRecordId} autoCapitalize="none" />
          <FormField label="Requested check-in ISO" value={requestedCheckInAt} onChangeText={setRequestedCheckInAt} autoCapitalize="none" />
          <FormField label="Requested check-out ISO" value={requestedCheckOutAt} onChangeText={setRequestedCheckOutAt} autoCapitalize="none" />
          <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
          <PrimaryButton loading={mutation.isPending} disabled={reason.length < 3} onPress={() => void submit()}>Gui yeu cau</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export { AdminAttendanceScreen } from './AdminAttendanceScreen';


export { AttendanceDetailScreen as AdminAttendanceDetailScreen };


import * as Location from 'expo-location';
import { useBranches } from '../../api/branches.api';
import { useDepartments } from '../../hooks/useDepartments';
import { CustomAlert } from '../../components/CustomAlert';

export function AttendanceLocationCreateScreen() {
  const router = useRouter();
  const mutation = useCreateAttendanceLocation();
  const updateMutation = useUpdateAttendanceLocation();
  const deleteMutation = useDeleteAttendanceLocation();
  const branches = useBranches();
  const departmentsQuery = useDepartments({ limit: 100 });
  const locationsQuery = useActiveAttendanceLocations();
  
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Lọc danh sách phòng ban theo chi nhánh đã chọn
  const availableDepartments = useMemo(() => {
    if (!branchId || !departmentsQuery.data) return [];
    return departmentsQuery.data.items.filter(d => d.branchId === branchId);
  }, [branchId, departmentsQuery.data]);

  const toggleDepartment = (id: string) => {
    setDepartmentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };


  async function submit() {
    if (!branchId) return CustomAlert.alert('Lỗi', 'Vui lòng chọn chi nhánh');
    try {
      const payload: any = {
        name,
        branchId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
      };
      if (departmentIds.length > 0) {
        payload.departmentIds = departmentIds;
      }

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
        CustomAlert.alert('Thành công', 'Đã cập nhật điểm chấm công');
      } else {
        await mutation.mutateAsync(payload);
        CustomAlert.alert('Thành công', 'Đã tạo điểm chấm công');
      }
      
      setName('');
      setLatitude('');
      setLongitude('');
      setBranchId('');
      setDepartmentIds([]);
      setEditingId(null);
      void locationsQuery.refetch();
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi', normalized.message);
    }
  }

  const handleEdit = (loc: any) => {
    setEditingId(loc.id);
    setName(loc.name);
    setBranchId(loc.branchId || '');
    setLatitude(loc.latitude.toString());
    setLongitude(loc.longitude.toString());
    setRadiusMeters(loc.radiusMeters.toString());
    setDepartmentIds(loc.departmentIds || []);
  };

  const handleDelete = (id: string) => {
    CustomAlert.alert('Xác nhận', 'Bạn có chắc muốn xóa điểm chấm công này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await deleteMutation.mutateAsync(id);
          CustomAlert.alert('Thành công', 'Đã xóa điểm chấm công');
          void locationsQuery.refetch();
        } catch (error) {
          CustomAlert.alert('Lỗi', normalizeApiError(error).message);
        }
      }}
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        <PageHeader title={editingId ? "Cập nhật điểm chấm công" : "Tạo điểm chấm công"} subtitle="Thiết lập vị trí chấm công cho chi nhánh" />
        <SectionCard>
          <FormField label="Tên điểm chấm công *" value={name} onChangeText={setName} placeholder="VD: Văn phòng chính" />
          
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#0B3B61', marginBottom: 8, marginTop: 8 }}>Chọn chi nhánh *</Text>
          <View style={{ gap: 8, marginBottom: 16 }}>
            {branches.data?.map(branch => (
              <Pressable 
                key={branch.id} 
                onPress={() => {
                  setBranchId(branch.id);
                  setDepartmentIds([]); // reset chosen depts when branch changes
                  if (branch.latitude && branch.longitude) {
                    setLatitude(branch.latitude.toString());
                    setLongitude(branch.longitude.toString());
                  } else {
                    setLatitude('');
                    setLongitude('');
                  }
                }}
                style={{
                  padding: 12, borderRadius: 8, borderWidth: 1,
                  borderColor: branchId === branch.id ? colors.primary : '#E6EEF3',
                  backgroundColor: branchId === branch.id ? 'rgba(30,136,229,0.1)' : '#fff'
                }}
              >
                <Text style={{ color: branchId === branch.id ? colors.primary : '#0B3B61', fontWeight: branchId === branch.id ? '700' : '500' }}>
                  {branch.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {branchId ? (
            <>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0B3B61', marginBottom: 8 }}>Áp dụng cho các phòng ban (Tùy chọn)</Text>
              <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 12 }}>Nếu không chọn, tất cả nhân viên thuộc chi nhánh này đều có thể chấm công tại đây.</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {availableDepartments.map(dept => {
                  const isSelected = departmentIds.includes(dept.id);
                  return (
                    <Pressable 
                      key={dept.id} 
                      onPress={() => toggleDepartment(dept.id)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        padding: 12, borderRadius: 8, borderWidth: 1,
                        borderColor: isSelected ? colors.primary : '#E6EEF3',
                        backgroundColor: isSelected ? 'rgba(30,136,229,0.05)' : '#fff'
                      }}
                    >
                      <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={20} color={isSelected ? colors.primary : '#98A0A8'} />
                      <Text style={{ color: '#0B3B61', fontWeight: isSelected ? '600' : '400' }}>{dept.name}</Text>
                    </Pressable>
                  );
                })}
                {availableDepartments.length === 0 && <Text style={{ color: '#98A0A8', fontStyle: 'italic' }}>Chi nhánh này chưa có phòng ban nào.</Text>}
              </View>
            </>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Vĩ độ (Latitude) *" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Kinh độ (Longitude) *" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" />
            </View>
          </View>
          

          <FormField label="Bán kính cho phép (mét) *" value={radiusMeters} onChangeText={setRadiusMeters} keyboardType="number-pad" />
          
          <PrimaryButton loading={mutation.isPending || updateMutation.isPending} disabled={!name || !latitude || !longitude || !branchId} onPress={() => void submit()}>
            {editingId ? "Lưu thay đổi" : "Tạo điểm chấm công"}
          </PrimaryButton>
          {editingId && (
            <SecondaryButton onPress={() => {
              setEditingId(null);
              setName(''); setBranchId(''); setLatitude(''); setLongitude(''); setRadiusMeters('100'); setDepartmentIds([]);
            }} style={{ marginTop: 8 }}>
              Hủy chỉnh sửa
            </SecondaryButton>
          )}
        </SectionCard>

        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0B3B61', marginBottom: 12 }}>Điểm chấm công đã tạo</Text>
          {locationsQuery.isLoading && <Text style={{ color: '#98A0A8' }}>Đang tải...</Text>}
          {locationsQuery.data?.length === 0 && !locationsQuery.isLoading && (
            <Text style={{ color: '#98A0A8', fontStyle: 'italic' }}>Chưa có điểm chấm công nào</Text>
          )}
          <View style={{ gap: 12 }}>
            {locationsQuery.data?.map(loc => (
              <View key={loc.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E6EEF3' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>{loc.name}</Text>
                    <Text style={{ fontSize: 13, color: '#1E88E5', marginTop: 2, fontWeight: '600' }}>Bán kính: {loc.radiusMeters}m</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={() => handleEdit(loc)}>
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(loc.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="location" size={14} color="#98A0A8" />
                  <Text style={{ fontSize: 12, color: '#98A0A8' }}>{loc.latitude}, {loc.longitude}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function PressableRow({ record, onPress }: { record: AttendanceRecord; onPress: () => void }) {
  return (
    <SecondaryButton onPress={onPress}>
      {formatDate(record.workDate)} - {record.status}
    </SecondaryButton>
  );
}

function AttendanceRecordCard({ record }: { record: AttendanceRecord | AttendanceDetail }) {
  const workedMinutes = minutesBetween(record.checkInAt, record.checkOutAt);
  return (
    <SectionCard title={formatDate(record.workDate)}>
      <View style={styles.row}>
        <Text style={styles.title}>{record.shiftAssignment?.shift?.name ?? 'Ca lam'}</Text>
        <StatusBadge label={record.status} tone={toneForStatus(record.status)} />
      </View>
      <Text style={styles.text}>Ke hoach: {formatShiftRange(record.shiftAssignment?.shift?.startTime, record.shiftAssignment?.shift?.endTime)}</Text>
      <Text style={styles.text}>Check-in: {formatDateTime(record.checkInAt)}</Text>
      <Text style={styles.text}>Check-out: {formatDateTime(record.checkOutAt)}</Text>
      <Text style={styles.text}>Thoi gian lam: {formatDurationMinutes(workedMinutes)}</Text>
      {'workedMinutes' in record ? <Text style={styles.text}>Di muon: {formatDurationMinutes(record.lateMinutes ?? 0)} | Ve som: {formatDurationMinutes(record.earlyLeaveMinutes ?? 0)} | OT: {formatDurationMinutes(record.overtimeMinutes ?? 0)}</Text> : null}
      {record.photo?.fileUrl ? <Text style={styles.muted}>Photo: {record.photo.fileUrl}</Text> : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
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
  warning: {
    color: colors.warning,
    fontSize: 14,
    lineHeight: 20,
  },
});