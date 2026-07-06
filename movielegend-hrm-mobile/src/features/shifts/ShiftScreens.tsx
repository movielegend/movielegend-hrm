import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { businessDateToday, formatDate, formatShiftRange } from '../../utils/date-time';
import { hasPermission } from '../../utils/permissions';
import { normalizeApiError } from '../../utils/api-error';
import { findTodayShift } from '../attendance/attendance.logic';
import { useAssignShift, useCreateShift, useCreateShiftRegistration, useCreateShiftSwap, useMySchedule, useShifts } from '../../hooks/useShifts';

export function EmployeeScheduleScreen() {
  const router = useRouter();
  const schedule = useMySchedule();
  const todayShift = useMemo(() => findTodayShift(schedule.data ?? []), [schedule.data]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Lich lam viec" subtitle={`Hom nay: ${businessDateToday()}`} />
        <SectionCard title="Ca hom nay">
          {todayShift?.shift ? (
            <>
              <Text style={styles.title}>{todayShift.shift.name}</Text>
              <Text style={styles.text}>{formatDate(todayShift.workDate)} - {formatShiftRange(todayShift.shift.startTime, todayShift.shift.endTime)}</Text>
              <StatusBadge label={todayShift.shift.isNightShift ? 'Ca dem' : 'Ca ngay'} tone={todayShift.shift.isNightShift ? 'info' : 'neutral'} />
            </>
          ) : (
            <EmptyState title="Chua co ca hom nay" message="Backend chua tra ca lam cho ngay hien tai." />
          )}
        </SectionCard>
        <SectionCard title="Danh sach ca">
          {(schedule.data ?? []).length ? (schedule.data ?? []).map((assignment) => (
            <View key={assignment.id} style={styles.row}>
              <View style={styles.grow}>
                <Text style={styles.title}>{assignment.shift?.name ?? assignment.shiftId}</Text>
                <Text style={styles.text}>{formatDate(assignment.workDate)} - {formatShiftRange(assignment.shift?.startTime, assignment.shift?.endTime)}</Text>
              </View>
              <StatusBadge label={assignment.status} tone="info" />
            </View>
          )) : <EmptyState />}
        </SectionCard>
        <SecondaryButton onPress={() => router.push('/employee/attendance')}>Mo cham cong</SecondaryButton>
        <ShiftRegistrationCard />
        <ShiftSwapCard />
      </ScrollView>
    </Screen>
  );
}

export function AdminShiftsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const shifts = useShifts();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Quan ly ca"
          subtitle="Danh sach ca tu backend /shifts"
          right={hasPermission(user, 'shift.create') ? <SecondaryButton onPress={() => router.push('/admin/shifts/create')}>Tao ca</SecondaryButton> : null}
        />
        {hasPermission(user, 'shift.assign') ? <SecondaryButton onPress={() => router.push('/admin/shifts/assign')}>Phan ca</SecondaryButton> : null}
        {(shifts.data ?? []).map((shift) => (
          <SectionCard key={shift.id} title={shift.name}>
            <Text style={styles.text}>Code: {shift.code}</Text>
            <Text style={styles.text}>{formatShiftRange(shift.startTime, shift.endTime)}</Text>
            <StatusBadge label={shift.isActive ? 'ACTIVE' : 'INACTIVE'} tone={shift.isActive ? 'success' : 'neutral'} />
          </SectionCard>
        ))}
        {!shifts.data?.length ? <EmptyState /> : null}
      </ScrollView>
    </Screen>
  );
}

export function CreateShiftScreen() {
  const createShift = useCreateShift();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  async function submit() {
    try {
      await createShift.mutateAsync({ code, name, startTime, endTime });
      Alert.alert('Thanh cong', 'Da tao ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tao ca" subtitle="Dung dung DTO CreateShift cua backend." />
        <SectionCard>
          <FormField label="Code" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <FormField label="Ten ca" value={name} onChangeText={setName} />
          <FormField label="Bat dau HH:mm" value={startTime} onChangeText={setStartTime} />
          <FormField label="Ket thuc HH:mm" value={endTime} onChangeText={setEndTime} />
          <PrimaryButton loading={createShift.isPending} disabled={!code || !name} onPress={() => void submit()}>Tao ca</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function LeaderShiftManagementScreen() {
  const assign = useAssignShift();
  const shifts = useShifts();
  const [userId, setUserId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [workDate, setWorkDate] = useState(businessDateToday());

  async function submit() {
    try {
      await assign.mutateAsync({ userId, departmentId, shiftId, workDate });
      Alert.alert('Thanh cong', 'Da phan ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
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

function ShiftSwapCard() {
  const mutation = useCreateShiftSwap();
  const [targetUserId, setTargetUserId] = useState('');
  const [fromShiftId, setFromShiftId] = useState('');
  const [toShiftId, setToShiftId] = useState('');
  const [fromDate, setFromDate] = useState(businessDateToday());
  const [toDate, setToDate] = useState(businessDateToday());
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ targetUserId, fromShiftId, toShiftId, fromDate, toDate, reason });
      Alert.alert('Thanh cong', 'Da tao yeu cau doi ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <SectionCard title="Yeu cau doi ca">
      <Text style={styles.muted}>Backend DTO hien dung targetUserId/fromShiftId/toShiftId/fromDate/toDate/reason.</Text>
      <FormField label="Target user ID" value={targetUserId} onChangeText={setTargetUserId} autoCapitalize="none" />
      <FormField label="From shift ID" value={fromShiftId} onChangeText={setFromShiftId} autoCapitalize="none" />
      <FormField label="To shift ID" value={toShiftId} onChangeText={setToShiftId} autoCapitalize="none" />
      <FormField label="From date" value={fromDate} onChangeText={setFromDate} />
      <FormField label="To date" value={toDate} onChangeText={setToDate} />
      <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
      <PrimaryButton loading={mutation.isPending} disabled={!targetUserId || !fromShiftId || !toShiftId || reason.length < 3} onPress={() => void submit()}>Gui doi ca</PrimaryButton>
    </SectionCard>
  );
}

function ShiftRegistrationCard() {
  const mutation = useCreateShiftRegistration();
  const shifts = useShifts();
  const [shiftId, setShiftId] = useState('');
  const [workDate, setWorkDate] = useState(businessDateToday());
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ shiftId, workDate, reason });
      Alert.alert('Thanh cong', 'Da gui yeu cau dang ky ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <SectionCard title="Dang ky ca">
      <Text style={styles.muted}>Chon shiftId that tu backend /shifts.</Text>
      {(shifts.data ?? []).slice(0, 5).map((shift) => <Text key={shift.id} style={styles.text}>{shift.name}: {shift.id}</Text>)}
      <FormField label="Shift ID" value={shiftId} onChangeText={setShiftId} autoCapitalize="none" />
      <FormField label="Work date" value={workDate} onChangeText={setWorkDate} />
      <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
      <PrimaryButton loading={mutation.isPending} disabled={!shiftId || reason.length < 3} onPress={() => void submit()}>Gui dang ky ca</PrimaryButton>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
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
});
