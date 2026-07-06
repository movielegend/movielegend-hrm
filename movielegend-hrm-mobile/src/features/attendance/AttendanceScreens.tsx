import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, type ComponentType } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { queryKeys } from '../../constants/queryKeys';
import { useActiveAttendanceLocations, useAttendanceDetail, useAttendanceHistory, useAttendanceReport, useCheckIn, useCheckOut, useCreateAttendanceAdjustment, useCreateAttendanceLocation, useCurrentAttendance } from '../../hooks/useAttendance';
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
  const current = useCurrentAttendance();
  const schedule = useMySchedule();
  const todayShift = useMemo(() => findTodayShift(schedule.data ?? []), [schedule.data]);
  const todayRecord = current.data?.attendance ?? null;
  const uiState = current.data?.state ?? 'NONE';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Cham cong" subtitle={`Ngay lam viec: ${businessDateToday()}`} />
        <SectionCard title="Trang thai hien tai">
          <StatusBadge label={uiState} tone={uiState === 'CHECKED_OUT' ? 'success' : uiState === 'CHECKED_IN' ? 'info' : 'neutral'} />
          <Text style={styles.text}>Nguon hien tai: /attendance/current.</Text>
          {todayRecord ? (
            <>
              <Text style={styles.text}>Check-in: {formatDateTime(todayRecord.checkInAt)}</Text>
              <Text style={styles.text}>Check-out: {formatDateTime(todayRecord.checkOutAt)}</Text>
            </>
          ) : null}
        </SectionCard>
        <SectionCard title="Ca hom nay">
          {todayShift?.shift ? (
            <>
              <Text style={styles.title}>{todayShift.shift.name}</Text>
              <Text style={styles.text}>{formatShiftRange(todayShift.shift.startTime, todayShift.shift.endTime)}</Text>
              <Text style={styles.text}>Work date: {formatDate(todayShift.workDate)}</Text>
            </>
          ) : (
            <EmptyState title="Chua co ca hom nay" message="Can phan ca tu backend truoc khi check-in." />
          )}
        </SectionCard>
        <View style={styles.actions}>
          <PrimaryButton disabled={uiState !== 'NONE' || !todayShift} onPress={() => router.push('/employee/attendance/check-in')}>Vao ca</PrimaryButton>
          <SecondaryButton disabled={uiState !== 'CHECKED_IN'} onPress={() => router.push('/employee/attendance/check-out')}>Tan ca</SecondaryButton>
          <SecondaryButton onPress={() => router.push('/employee/attendance/history')}>Lich su</SecondaryButton>
        </View>
      </ScrollView>
    </Screen>
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useAttendanceDetail(id ?? '');
  const router = useRouter();
  const record = detail.data;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Chi tiet cham cong" subtitle={id} />
        {record ? (
          <AttendanceRecordCard record={record} />
        ) : (
          <EmptyState title="Khong tim thay ban ghi" message="Khong tai duoc /attendance/:id hoac ban khong co quyen." />
        )}
        <SecondaryButton onPress={() => router.push({ pathname: '/employee/attendance/adjustment', params: { attendanceRecordId: id ?? '' } })}>Tao dieu chinh cong</SecondaryButton>
      </ScrollView>
    </Screen>
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
  const history = useAttendanceReport();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tong quan cham cong" subtitle="Admin xem toan bo qua /attendance." />
        {(history.data?.items ?? []).map((record) => <AttendanceRecordCard key={record.id} record={record} />)}
        {!history.data?.items.length ? <EmptyState /> : null}
      </ScrollView>
    </Screen>
  );
}

export function AttendanceLocationCreateScreen() {
  const mutation = useCreateAttendanceLocation();
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');

  async function submit() {
    try {
      await mutation.mutateAsync({
        name,
        ...(departmentId ? { departmentId } : {}),
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
      });
      Alert.alert('Thanh cong', 'Da tao diem cham cong');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Diem cham cong" subtitle="Tao attendance location theo backend DTO." />
        <SectionCard>
          <FormField label="Ten diem" value={name} onChangeText={setName} />
          <FormField label="Department ID optional" value={departmentId} onChangeText={setDepartmentId} autoCapitalize="none" />
          <FormField label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" />
          <FormField label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" />
          <FormField label="Radius meters" value={radiusMeters} onChangeText={setRadiusMeters} keyboardType="number-pad" />
          <PrimaryButton loading={mutation.isPending} disabled={!name || !latitude || !longitude} onPress={() => void submit()}>Tao diem</PrimaryButton>
        </SectionCard>
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
