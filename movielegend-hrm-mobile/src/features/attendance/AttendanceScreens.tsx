
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Modal } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useMemo, useState, type ComponentType } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';

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
import { businessDateToday, formatDate, formatDateTime, formatDurationMinutes, formatShiftRange, minutesBetween } from '../../utils/date-time';
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

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

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
  const history = useAttendanceHistory({ page: 1, limit: 20 });
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Lich su cham cong" subtitle="Du lieu own history tu /attendance/my." />
        {(history.data?.items ?? []).map((record) => (
          <SectionCard key={record.id}>
            <PressableRow record={record} onPress={() => router.push(`/employee/attendance/${record.id}`)} />
          </SectionCard>
        ))}
        {!history.data?.items.length ? (
          history.isError ? (
            <EmptyState title="Chua co du lieu" message="Khong tai duoc /attendance/my." />
          ) : (
            <EmptyState title="Chua co du lieu" />
          )
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export function AttendanceDetailScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#0B3B61" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0B3B61' }}>Chi tiết Check-in</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0B3B61', marginBottom: 4 }}>Trần Hoàng Nam</Text>
          <Text style={{ fontSize: 13, color: '#98A0A8', marginBottom: 12 }}>Chuyên viên Kho vận (Senior)</Text>
          <View style={{ backgroundColor: '#EAF4FE', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E88E5', textTransform: 'uppercase' }}>Thứ Hai, 15/10/2023</Text>
          </View>
        </View>

        {/* Timeline Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="navigate-outline" size={18} color="#1E88E5" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0B3B61' }}>Lộ trình Giai đoạn</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#98A0A8' }}>Hoàn tất</Text>
        </View>

        {/* Timeline Items */}
        <View style={{ marginLeft: 16, borderLeftWidth: 1, borderLeftColor: '#E6EEF3', paddingLeft: 24, paddingBottom: 24, gap: 24 }}>

          {/* Item 1 */}
          <View style={{ position: 'relative' }}>
            <View style={{ position: 'absolute', left: -34, top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="checkmark" size={12} color="#0B3B61" />
            </View>
            <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6EEF3' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#98A0A8', textTransform: 'uppercase' }}>Giai đoạn 1: Check-in</Text>
                <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981' }}>Đúng giờ</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="time-outline" size={14} color="#1E88E5" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B3B61' }}>07:55 AM</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Ionicons name="location-outline" size={14} color="#98A0A8" />
                <Text style={{ fontSize: 12, color: '#98A0A8' }}>Cổng chính - Tòa nhà BizFlow, Q1, TP.HCM</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80' }} style={{ width: 64, height: 64, borderRadius: 8 }} />
            </View>
          </View>

          {/* Item 2 */}
          <View style={{ position: 'relative' }}>
            <View style={{ position: 'absolute', left: -34, top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="checkmark" size={12} color="#0B3B61" />
            </View>
            <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6EEF3' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#98A0A8', textTransform: 'uppercase' }}>Giai đoạn 2: Check-out</Text>
                <View style={{ backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#CA8A04' }}>Về sớm (5p)</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="time-outline" size={14} color="#1E88E5" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B3B61' }}>05:15 PM</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Ionicons name="location-outline" size={14} color="#98A0A8" />
                <Text style={{ fontSize: 12, color: '#98A0A8' }}>Cổng phụ số 2 - Đường Lê Lợi</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=200&q=80' }} style={{ width: 64, height: 64, borderRadius: 8 }} />
            </View>
          </View>
        </View>

        {/* GPS Data */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E6EEF3' }}>
          <Ionicons name="location" size={20} color="#0B3B61" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0B3B61', marginBottom: 2 }}>Dữ liệu GPS Cuối cùng</Text>
            <Text style={{ fontSize: 11, color: '#98A0A8' }}>Khu vực nhà xe trung tâm</Text>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
            <Text style={{ fontSize: 10, color: '#98A0A8' }}>10.762622,</Text>
            <Text style={{ fontSize: 10, color: '#98A0A8' }}>106.660172</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="chatbubble-outline" size={18} color="#1E88E5" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0B3B61' }}>Ghi chú nhân viên</Text>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6EEF3' }}>
            <Text style={{ fontSize: 13, color: '#3B4A59', fontStyle: 'italic', lineHeight: 20 }}>
              "Khu vực bãi đỗ xe phía Bắc đang bảo trì, phải check-in tại cổng phụ số 2. Đã xin phép quản lý trực tiếp."
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Từ chối</Text>
          </Pressable>
          <Pressable style={{ flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E6EEF3', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="flag-outline" size={18} color="#0B3B61" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0B3B61' }}>Gán cờ</Text>
          </Pressable>
          <Pressable style={{ flex: 1.5, backgroundColor: '#1E88E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Duyệt</Text>
          </Pressable>
        </View>

      </ScrollView>
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
  const basePath = segments[0] === 'leader' ? '/leader' : '/admin';
  const isLeader = segments[0] === 'leader';
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0] || ''); // YYYY-MM-DD
  const [showPicker, setShowPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setCurrentDate(selectedDate.toISOString().split('T')[0] || '');
    }
  };
  
  const statsQuery = useAttendanceDashboardStats({ fromDate: currentDate, toDate: currentDate });
  const reportQuery = useAttendanceReport({ fromDate: currentDate, toDate: currentDate, limit: 50 });

  const stats = statsQuery.data;
  const records = reportQuery.data?.items || [];

  const onTimePercentage = stats?.present ? Math.round(((stats.onTime || 0) / stats.present) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{isLeader ? 'Chấm công phòng ban' : 'Quản lý chấm công'}</Text>
          </View>
        </View>

        {/* Date Selector */}
        <Pressable 
          onPress={() => setShowPicker(true)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E6EEF3' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={20} color="#111827" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{new Date(currentDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#111827" />
        </Pressable>

        {showPicker && (
          <CustomDatePickerModal
            visible={showPicker}
            initialDate={new Date(currentDate)}
            onClose={() => setShowPicker(false)}
            onSelect={(date) => {
              setShowPicker(false);
              setCurrentDate(date.toISOString().split('T')[0]);
            }}
          />
        )}

        {/* Stat Cards */}
        {statsQuery.isLoading ? <LoadingState /> : (
          <View style={{ gap: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
              <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="people" size={14} color="#111827" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{stats?.present ?? 0}/{stats?.totalUsers ?? 0}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Có mặt</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="time-outline" size={14} color="#111827" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{onTimePercentage}%</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Đúng giờ</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
              <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="time-outline" size={14} color="#111827" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{stats?.late ?? 0}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Đi muộn</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="close-outline" size={16} color="#111827" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{stats?.absent ?? 0}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Vắng mặt</Text>
              </View>
            </View>
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
    </View>
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