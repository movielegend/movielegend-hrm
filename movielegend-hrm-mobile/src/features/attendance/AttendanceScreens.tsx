
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Modal } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useMemo, useState, useCallback, type ComponentType } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StyleSheet, Text, View, TouchableWithoutFeedback, RefreshControl } from 'react-native';

import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';

import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
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

export function AttendanceHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#0B3B61" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0B3B61' }}>Chấm công</Text>
          </View>
          <Pressable style={{ padding: 4 }}>
            <Ionicons name="funnel-outline" size={24} color="#98A0A8" />
          </Pressable>
        </View>

        {/* User Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }} style={{ width: 44, height: 44, borderRadius: 22 }} />
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>Phùng Thanh Bình</Text>
              <Text style={{ fontSize: 13, color: '#98A0A8' }}>Mã nhân viên: WT-9821</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(30,136,229,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
            <Ionicons name="location" size={12} color="#1E88E5" />
            <Text style={{ fontSize: 11, color: '#1E88E5', fontWeight: '700' }}>GPS: ON</Text>
          </View>
        </View>

        {/* Big Check-in Card */}
        <View style={{ backgroundColor: '#F0F8FF', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#E6EEF3', position: 'relative', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: '#EAF4FE' }} />

          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E88E5', letterSpacing: 1, marginBottom: 4 }}>THỨ BA, 07 THÁNG 05</Text>
          <Text style={{ fontSize: 48, fontWeight: '900', color: '#0B3B61', marginBottom: 24 }}>09:48</Text>

          <Pressable style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: '#1E88E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginBottom: 32 }}>
            <Ionicons name="finger-print" size={48} color="#FFFFFF" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 8 }}>VÀO CA</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16 }}>
            <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E6EEF3' }}>
              <Text style={{ fontSize: 11, color: '#98A0A8', fontWeight: '600', marginBottom: 4 }}>GIỜ VÀO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="return-down-forward" size={14} color="#0B3B61" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>08:02</Text>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#98A0A8', fontWeight: '600', marginBottom: 4 }}>TỔNG GIỜ</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={16} color="#1E88E5" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E88E5' }}>01:46h</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location" size={14} color="#1E88E5" />
            <Text style={{ fontSize: 11, color: '#98A0A8' }}>364 Cộng Hòa, Phường 13, Tân Bình, TP.HCM</Text>
          </View>
        </View>

        {/* Lịch sử gần đây */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0B3B61' }}>Lịch sử gần đây</Text>
              <View style={{ backgroundColor: '#F0F4F8', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#98A0A8' }}>12</Text>
              </View>
            </View>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#1E88E5', fontWeight: '600' }}>Xem tất cả </Text>
              <Ionicons name="chevron-forward" size={14} color="#1E88E5" />
            </Pressable>
          </View>

          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(30,136,229,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Ionicons name="log-in-outline" size={20} color="#0B3B61" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0B3B61' }}>Vào ca</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="location-outline" size={12} color="#98A0A8" />
                  <Text style={{ fontSize: 13, color: '#98A0A8' }}>Văn phòng trụ sở chính</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0B3B61' }}>08:02</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#98A0A8', marginTop: 2 }}>HÔM NAY</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0B3B61' }}>Tan ca</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="location-outline" size={12} color="#98A0A8" />
                  <Text style={{ fontSize: 13, color: '#98A0A8' }}>Văn phòng trụ sở chính</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0B3B61' }}>17:35</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#98A0A8', marginTop: 2 }}>06/05/2024</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Warning Box */}
        <View style={{ backgroundColor: '#FFF7ED', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 16, borderWidth: 1, borderColor: '#FFEDD5' }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0B3B61', marginBottom: 4 }}>Bạn còn 2 ca chưa xác nhận</Text>
            <Text style={{ fontSize: 12, color: '#3B4A59', marginBottom: 12, lineHeight: 18 }}>Các ca làm việc ngày 04/05 đang chờ quản lý xác nhận vị trí.</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0B3B61' }}>Kiểm tra ngay</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

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
      Alert.alert('Thieu anh', 'Hay chup anh cham cong truoc khi check-in.');
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
      Alert.alert('Thanh cong', 'Da check-in');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, mapAttendanceError(normalized.code, normalized.message));
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
      Alert.alert('Thanh cong', 'Da checkout');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, mapAttendanceError(normalized.code, normalized.message));
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

export function AttendanceHistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const history = useAttendanceHistory({ page: 1, limit: 100 });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  // Handle Month Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

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
          map[key] = item;
        }
      });
    }
    return map;
  }, [history.data?.items]);

  // Filter items for selected day or full month list
  const displayedItems = useMemo(() => {
    const items = history.data?.items ?? [];
    return items.filter((record: any) => {
      const d = new Date(record.workDate);
      const isSameMonth = d.getMonth() + 1 === month && d.getFullYear() === year;
      if (!isSameMonth) return false;
      if (selectedDay !== null) {
        return d.getDate() === selectedDay;
      }
      return true;
    });
  }, [history.data?.items, month, year, selectedDay]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>Lịch sử chấm công</Text>
        </View>

        {/* Calendar Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ECEEF3', marginBottom: 20 }}>
          {/* Month Header Navigation */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Pressable onPress={prevMonth} style={{ padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' }}>
              <Ionicons name="chevron-back" size={18} color="#374151" />
            </Pressable>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
              Tháng {month < 10 ? `0${month}` : month}/{year}
            </Text>
            <Pressable onPress={nextMonth} style={{ padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' }}>
              <Ionicons name="chevron-forward" size={18} color="#374151" />
            </Pressable>
          </View>

          {/* Weekday Headers */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <Text key={idx} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: idx >= 5 ? '#EF4444' : '#6B7280' }}>
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {/* Empty slots for previous month padding */}
            {Array.from({ length: startingOffset }).map((_, idx) => (
              <View key={`empty-${idx}`} style={{ width: '14.28%', height: 44 }} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = `${year}-${month < 10 ? `0${month}` : month}-${dayNum < 10 ? `0${dayNum}` : dayNum}`;
              const record = attendanceMap[dateKey];
              const isSelected = selectedDay === dayNum;

              // Premium Color & Status Styling
              // 🟢 HOÀN TẤT: Soft Emerald Green background + Check mark icon
              // 🟡 THIẾU IN/OUT: Soft Amber/Yellow background + Alert icon / Warning
              // ⚪ NGHỈ / KHÔNG CÔNG: Soft Neutral Gray background / Clean Text
              let dayBg = '#F9FAFB';
              let dayBorderColor = '#F3F4F6';
              let textColor = '#374151';
              let statusIcon = null;

              if (record) {
                const hasIn = Boolean(record.checkInAt);
                const hasOut = Boolean(record.checkOutAt);
                if (hasIn && hasOut) {
                  dayBg = '#ECFDF5'; // Soft Emerald Green
                  dayBorderColor = '#A7F3D0';
                  textColor = '#065F46';
                  statusIcon = <Ionicons name="checkmark-circle" size={12} color="#10B981" style={{ position: 'absolute', top: -2, right: -2 }} />;
                } else if (hasIn || hasOut) {
                  dayBg = '#FFFBEB'; // Soft Amber / Yellow
                  dayBorderColor = '#FDE68A';
                  textColor = '#92400E';
                  statusIcon = <Ionicons name="alert-circle" size={12} color="#F59E0B" style={{ position: 'absolute', top: -2, right: -2 }} />;
                }
              }

              if (isSelected) {
                dayBg = '#2563EB';
                dayBorderColor = '#2563EB';
                textColor = '#FFFFFF';
              }

              return (
                <Pressable
                  key={`day-${dayNum}`}
                  onPress={() => setSelectedDay(isSelected ? null : dayNum)}
                  style={{
                    width: '14.28%',
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: dayBg,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: dayBorderColor,
                      shadowColor: isSelected ? '#2563EB' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: isSelected ? 3 : 0,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                      {dayNum}
                    </Text>

                    {/* Status Badge Icon on Top Corner */}
                    {!isSelected && statusIcon}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Premium Status Legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#A7F3D0' }}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={{ fontSize: 11, color: '#065F46', fontWeight: '700' }}>Hoàn tất</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A' }}>
              <Ionicons name="alert-circle" size={14} color="#F59E0B" />
              <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '700' }}>Thiếu In/Out</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' }} />
              <Text style={{ fontSize: 11, color: '#4B5563', fontWeight: '600' }}>Nghỉ / Trống</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Filter Badge indicator */}
        {selectedDay !== null && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#4B5563' }}>
              Chi tiết ngày {selectedDay}/{month}/{year}:
            </Text>
            <Pressable onPress={() => setSelectedDay(null)}>
              <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>Xem cả tháng</Text>
            </Pressable>
          </View>
        )}

        {history.isLoading ? <Text style={{ color: '#6B7280', textAlign: 'center', marginVertical: 12 }}>Đang tải...</Text> : null}

        {/* Attendance Records List */}
        <View style={{ gap: 16 }}>
          {displayedItems.map((record: any) => {
            const dateStr = new Date(record.workDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
            const checkInTime = record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const checkOutTime = record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const shiftName = record.shiftAssignment?.shift?.name || 'Ca làm việc';
            
            // Status determination
            let statusText = 'CHƯA RÕ';
            let statusColor = '#6B7280';
            let statusBg = '#F3F4F6';

            if (record.checkInAt && record.checkOutAt) {
              statusText = 'HOÀN TẤT'; statusColor = '#10B981'; statusBg = '#ECFDF5';
            } else if (record.checkInAt || record.checkOutAt) {
              statusText = record.checkInAt ? 'THIẾU CHECK-OUT' : 'THIẾU CHECK-IN';
              statusColor = '#F59E0B'; statusBg = '#FFFBEB';
            } else if (record.status === 'ABSENT') {
              statusText = 'VẮNG MẶT'; statusColor = '#EF4444'; statusBg = '#FEF2F2';
            }

            return (
              <Pressable 
                key={record.id} 
                onPress={() => router.push(`/employee/attendance/${record.id}`)}
                style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{dateStr}</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{shiftName}</Text>
                  </View>
                  <View style={{ backgroundColor: statusBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{statusText}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="enter-outline" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Check-in</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }}>{checkInTime}</Text>
                    </View>
                  </View>

                  <View style={{ width: 1, height: 30, backgroundColor: '#E5E7EB' }} />

                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="exit-outline" size={16} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Check-out</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }}>{checkOutTime}</Text>
                    </View>
                  </View>
                </View>
                
                {(record.lateMinutes > 0 || record.earlyLeaveMinutes > 0) && (
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                      {record.lateMinutes > 0 && <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '500' }}>• Đi muộn: {record.lateMinutes}p</Text>}
                      {record.earlyLeaveMinutes > 0 && <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '500' }}>• Về sớm: {record.earlyLeaveMinutes}p</Text>}
                   </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {!displayedItems.length && !history.isLoading ? (
          history.isError ? (
            <EmptyState title="Không có dữ liệu" message="Lỗi khi tải lịch sử chấm công." />
          ) : (
            <EmptyState icon="calendar-outline" title="Chưa có dữ liệu chấm công" message={selectedDay ? `Không có dữ liệu chấm công cho ngày ${selectedDay}/${month}/${year}` : "Không có dữ liệu chấm công trong tháng này."} />
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

export function AttendanceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useAttendanceDetail(id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingState />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <EmptyState title="Không tìm thấy chi tiết chấm công" />
      </View>
    );
  }

  const user = (detail as any).user;
  const name = user?.profile?.fullName || user?.userCode || 'Unknown';
  const role = user?.profile?.role || 'Nhân viên';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>Chi tiết Check-in</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image source={{ uri: getAbsoluteImageUrl(user?.profile?.avatarUrl) || 'https://via.placeholder.com/150' }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{name}</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{role}</Text>
          <View style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' }}>
              {new Date(detail.workDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Timeline Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="navigate-outline" size={18} color="#111827" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Lộ trình Giai đoạn</Text>
          </View>
        </View>

        {/* Timeline Items */}
        <View style={{ marginLeft: 16, borderLeftWidth: 1, borderLeftColor: '#E6EEF3', paddingLeft: 24, paddingBottom: 24, gap: 24 }}>

          {/* Check In */}
          {detail.checkInAt && (
            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', left: -34, top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111827' }} />
              </View>
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Check-in</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="time-outline" size={14} color="#3B82F6" />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                    {new Date(detail.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    Tọa độ: {(detail as any).gps?.attendanceLocation?.name || `${(detail as any).gps?.checkInLatitude}, ${(detail as any).gps?.checkInLongitude}`}
                  </Text>
                </View>
                {(detail as any).photo?.fileUrl && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>Ảnh Check-in</Text>
                    <Pressable onPress={() => setSelectedImage(getAbsoluteImageUrl((detail as any).photo.fileUrl) || null)}>
                      <Image source={{ uri: getAbsoluteImageUrl((detail as any).photo.fileUrl) }} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#ECEEF3' }} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Check Out */}
          {detail.checkOutAt && (
            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', left: -34, top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111827' }} />
              </View>
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Check-out</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="time-outline" size={14} color="#3B82F6" />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                    {new Date(detail.checkOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    Tọa độ: {(detail as any).gps?.attendanceLocation?.name || `${(detail as any).gps?.checkOutLatitude}, ${(detail as any).gps?.checkOutLongitude}`}
                  </Text>
                </View>
                {(detail as any).checkOutPhoto?.fileUrl && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>Ảnh Check-out</Text>
                    <Pressable onPress={() => setSelectedImage(getAbsoluteImageUrl((detail as any).checkOutPhoto.fileUrl) || null)}>
                      <Image source={{ uri: getAbsoluteImageUrl((detail as any).checkOutPhoto.fileUrl) }} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#ECEEF3' }} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <Pressable style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </Pressable>
            <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
              <Image source={require('../../../assets/logo-watermark.png')} style={{ width: 120, height: 30, resizeMode: 'contain' }} />
            </View>
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
      Alert.alert('Thanh cong', 'Da gui yeu cau dieu chinh cong');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
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

export function AdminAttendanceScreen() {
  const router = useRouter();
  const segments = useSegments();
  const basePath = segments[0] === 'leader' ? '/leader' : segments[0] === 'hr' ? '/hr' : '/admin';
  const isLeader = segments[0] === 'leader';
  const [currentDate, setCurrentDate] = useState<string>(formatDateYYYYMMDD()); // YYYY-MM-DD
  const [showPicker, setShowPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const dateObj = parseDateYYYYMMDD(currentDate);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setCurrentDate(formatDateYYYYMMDD(selectedDate));
    }
  };
  
  const statsQuery = useAttendanceDashboardStats({ fromDate: currentDate, toDate: currentDate });
  const reportQuery = useAttendanceReport({ fromDate: currentDate, toDate: currentDate, limit: 50 });

  const stats = statsQuery.data;
  const records = reportQuery.data?.items || [];

  const onTimePercentage = stats?.present ? Math.round(((stats.onTime || 0) / stats.present) * 100) : 0;
  
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const formattedDateTitle = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>
            {isLeader ? 'Chấm công phòng ban' : 'Quản lý chấm công'}
          </Text>
        </View>

        {/* Date Selector (Card đẹp mắt hơn) */}
        <Pressable 
          onPress={() => setShowPicker(true)}
          style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            backgroundColor: '#FFFFFF', 
            padding: 16, 
            borderRadius: 20, 
            marginBottom: 20, 
            borderWidth: 1, 
            borderColor: '#F3F4F6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="calendar" size={22} color="#111827" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', marginBottom: 2 }}>Ngày đang xem</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={1}>
                {formattedDateTitle.charAt(0).toUpperCase() + formattedDateTitle.slice(1)}
              </Text>
            </View>
          </View>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
            <Ionicons name="chevron-down" size={18} color="#4B5563" />
          </View>
        </Pressable>

        {showPicker && (
          <CustomDatePickerModal
            visible={showPicker}
            initialDate={dateObj}
            onClose={() => setShowPicker(false)}
            onSelect={(date) => {
              setShowPicker(false);
              setCurrentDate(formatDateYYYYMMDD(date));
            }}
          />
        )}

        {/* Stat Cards */}
        {statsQuery.isLoading ? <LoadingState /> : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="people" size={12} color="#111827" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 }}>{stats?.present ?? 0}/{stats?.totalUsers ?? 0}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' }}>Có mặt</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="time-outline" size={12} color="#111827" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 }}>{onTimePercentage}%</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' }}>Đúng giờ</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="time-outline" size={12} color="#111827" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 }}>{stats?.late ?? 0}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' }}>Đi muộn</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="close-outline" size={14} color="#111827" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 }}>{stats?.absent ?? 0}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' }}>Vắng mặt</Text>
            </View>
          </View>
        )}

        {!isLeader && (
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
            <Pressable onPress={() => router.push(`${basePath}/attendance/overtime-config` as any)} style={{ flex: 1, backgroundColor: '#111827', padding: 16, borderRadius: 16, alignItems: 'center' }}>
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>Cấu hình{'\n'}Tăng ca</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`${basePath}/attendance/report` as any)} style={{ flex: 1, backgroundColor: '#059669', padding: 16, borderRadius: 16, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>Báo cáo{'\n'}Xuất Excel</Text>
            </Pressable>
          </View>
        )}

        {/* Employee List Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Danh sách chấm công ({reportQuery.data?.pagination?.total ?? 0})</Text>
        </View>

        {/* Employee List */}
        {reportQuery.isLoading ? <LoadingState /> : (
          <View style={{ gap: 12 }}>
            {records.length === 0 ? <EmptyState icon="file-document-outline" title="Không có bản ghi nào hôm nay" message="Dữ liệu chấm công sẽ hiển thị tại đây khi có bản ghi." /> : null}
            {records.map((record) => {
              const user = (record as any).user; // The backend includes 'user' in findAll
              const name = user?.profile?.fullName || user?.userCode || 'Unknown';
              const time = new Date(record.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <View key={record.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' }}>
                  <Pressable onPress={() => { if ((record as any).photo?.fileUrl) setSelectedImage(getAbsoluteImageUrl((record as any).photo.fileUrl) || null); }}>
                    <Image source={{ uri: getAbsoluteImageUrl((record as any).photo?.fileUrl) || getAbsoluteImageUrl(user?.profile?.avatarUrl) || 'https://via.placeholder.com/150' }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#ECEEF3' }} />
                  </Pressable>
                  <Pressable style={{ flex: 1, marginLeft: 12 }} onPress={() => router.push(`${basePath}/attendance/${record.id}`)}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{user?.userCode}</Text>
                  </Pressable>
                  <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                    <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#3B82F6' }}>CÓ MẶT</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={{ fontSize: 11, color: '#6B7280' }}>{time}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => router.push(`${basePath}/attendance/${record.id}`)} style={{ padding: 4 }}>
                    <Ionicons name="chevron-forward" size={16} color="#111827" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <Pressable style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </Pressable>
            <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
              <Image source={require('../../../assets/logo-watermark.png')} style={{ width: 120, height: 30, resizeMode: 'contain' }} />
            </View>
            <Image source={{ uri: selectedImage }} style={{ width: '90%', height: '80%', resizeMode: 'contain' }} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

export function AdminAttendanceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useAttendanceDetail(id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingState />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <EmptyState title="Không tìm thấy chi tiết chấm công" />
      </View>
    );
  }

  const user = (detail as any).user;
  const name = user?.profile?.fullName || user?.userCode || 'Unknown';
  const role = user?.profile?.role || 'Nhân viên';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>Chi tiết Check-in</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image source={{ uri: getAbsoluteImageUrl(user?.profile?.avatarUrl) || 'https://via.placeholder.com/150' }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{name}</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{role}</Text>
          <View style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' }}>
              {new Date(detail.workDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Timeline Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="navigate-outline" size={18} color="#111827" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Lộ trình Giai đoạn</Text>
          </View>
        </View>

        {/* Timeline Items */}
        <View style={{ marginLeft: 16, borderLeftWidth: 1, borderLeftColor: '#E6EEF3', paddingLeft: 24, paddingBottom: 24, gap: 24 }}>

          {/* Check In */}
          {detail.checkInAt && (
            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', left: -34, top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111827' }} />
              </View>
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Check-in</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="time-outline" size={14} color="#3B82F6" />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                    {new Date(detail.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    Tọa độ: {(detail as any).gps?.attendanceLocation?.name || `${(detail as any).gps?.checkInLatitude}, ${(detail as any).gps?.checkInLongitude}`}
                  </Text>
                </View>
                {(detail as any).photo?.fileUrl && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>Ảnh Check-in</Text>
                    <Pressable onPress={() => setSelectedImage(getAbsoluteImageUrl((detail as any).photo.fileUrl) || null)}>
                      <Image source={{ uri: getAbsoluteImageUrl((detail as any).photo.fileUrl) }} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#ECEEF3' }} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Check Out */}
          {detail.checkOutAt && (
            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', left: -34, top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111827' }} />
              </View>
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Check-out</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="time-outline" size={14} color="#3B82F6" />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                    {new Date(detail.checkOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    Tọa độ: {(detail as any).gps?.attendanceLocation?.name || `${(detail as any).gps?.checkOutLatitude}, ${(detail as any).gps?.checkOutLongitude}`}
                  </Text>
                </View>
                {(detail as any).checkOutPhoto?.fileUrl && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>Ảnh Check-out</Text>
                    <Pressable onPress={() => setSelectedImage(getAbsoluteImageUrl((detail as any).checkOutPhoto.fileUrl) || null)}>
                      <Image source={{ uri: getAbsoluteImageUrl((detail as any).checkOutPhoto.fileUrl) }} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#ECEEF3' }} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <Pressable style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </Pressable>
            <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
              <Image source={require('../../../assets/logo-watermark.png')} style={{ width: 120, height: 30, resizeMode: 'contain' }} />
            </View>
            <Image source={{ uri: selectedImage }} style={{ width: '90%', height: '80%', resizeMode: 'contain' }} />
          </View>
        </Modal>
      )}
    </View>
  );
}

import * as Location from 'expo-location';
import { useBranches } from '../../api/branches.api';
import { useDepartments } from '../../hooks/useDepartments';

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
    if (!branchId) return Alert.alert('Lỗi', 'Vui lòng chọn chi nhánh');
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
        Alert.alert('Thành công', 'Đã cập nhật điểm chấm công');
      } else {
        await mutation.mutateAsync(payload);
        Alert.alert('Thành công', 'Đã tạo điểm chấm công');
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
      Alert.alert('Lỗi', normalized.message);
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
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa điểm chấm công này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await deleteMutation.mutateAsync(id);
          Alert.alert('Thành công', 'Đã xóa điểm chấm công');
          void locationsQuery.refetch();
        } catch (error) {
          Alert.alert('Lỗi', normalizeApiError(error).message);
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