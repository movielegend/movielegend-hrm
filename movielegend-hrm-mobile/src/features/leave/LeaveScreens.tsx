import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useDashboard } from '../../hooks/useDashboard';
import { useApproveLeaveRequest, useCreateLeaveRequest, useLeaveRequests, useLeaveTypes, useRejectLeaveRequest } from '../../hooks/useLeave';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { LeaveBalance, LeaveRequest } from '../../types/leave.types';
import { businessDateToday, formatDate } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';

export function LeaveHomeScreen() {
  const router = useRouter();
  const dashboard = useDashboard('EMPLOYEE');
  const requests = useLeaveRequests();
  const balances = ((dashboard.data?.leave as { leaveBalances?: LeaveBalance[] } | undefined)?.leaveBalances ?? []);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Nghi phep" subtitle="Balance lay tu /dashboard/me vi backend chua co endpoint leave balance rieng." />
        <PrimaryButton onPress={() => router.push('/employee/leave/create')}>Tao don nghi</PrimaryButton>
        <SectionCard title="So du phep">
          {balances.length ? balances.map((balance) => (
            <View key={balance.id} style={styles.row}>
              <Text style={styles.title}>{balance.leaveType?.name ?? balance.leaveTypeId}</Text>
              <Text style={styles.text}>Con lai: {Number(balance.balanceDays) - Number(balance.usedDays)}</Text>
            </View>
          )) : <EmptyState title="Chua co so du" message="Backend khong co endpoint balance rieng; dashboard co the chua co du lieu." />}
        </SectionCard>
        <SecondaryButton onPress={() => {}}>Keo xuong de refresh tu navigator</SecondaryButton>
        <SectionCard title="Lich su don">
          {(requests.data ?? []).map((request) => <LeaveRequestCard key={request.id} request={request} />)}
          {!requests.data?.length ? <EmptyState /> : null}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function CreateLeaveRequestScreen() {
  const mutation = useCreateLeaveRequest();
  const leaveTypes = useLeaveTypes();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(businessDateToday());
  const [endDate, setEndDate] = useState(businessDateToday());
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ leaveTypeId, startDate, endDate, reason });
      Alert.alert('Thanh cong', 'Da gui don nghi');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tao don nghi" subtitle="Chon leave type that tu /leave/types." />
        <SectionCard title="Loai nghi">
          {(leaveTypes.data ?? []).map((leaveType) => (
            <SecondaryButton key={leaveType.id} disabled={leaveTypeId === leaveType.id} onPress={() => setLeaveTypeId(leaveType.id)}>
              {leaveType.name}
            </SecondaryButton>
          ))}
          {!leaveTypes.data?.length ? <EmptyState title="Chua co leave type active" /> : null}
        </SectionCard>
        <SectionCard>
          <FormField label="Leave type ID" value={leaveTypeId} onChangeText={setLeaveTypeId} autoCapitalize="none" />
          <FormField label="Start date YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
          <FormField label="End date YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
          <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
          <PrimaryButton loading={mutation.isPending} disabled={!leaveTypeId || reason.length < 3} onPress={() => void submit()}>Gui don nghi</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function LeaveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requests = useLeaveRequests();
  const request = requests.data?.find((item) => item.id === id);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Chi tiet don nghi" subtitle={id} />
        {request ? <LeaveRequestCard request={request} /> : <EmptyState title="Khong tim thay don" message="Backend chua co leave request detail endpoint." />}
      </ScrollView>
    </Screen>
  );
}

export function LeaderLeaveApprovalsScreen() {
  const requests = useLeaveRequests();
  const approve = useApproveLeaveRequest();
  const reject = useRejectLeaveRequest();
  const pending = (requests.data ?? []).filter((item) => item.status === 'PENDING');

  async function approveRequest(id: string) {
    try {
      await approve.mutateAsync(id);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  async function rejectRequest(id: string) {
    try {
      await reject.mutateAsync({ id, payload: { reason: 'Rejected from mobile' } });
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Duyet nghi phep" subtitle="Leader/Admin scope do backend enforce." />
        {pending.map((request) => (
          <SectionCard key={request.id}>
            <LeaveRequestCard request={request} />
            <View style={styles.actions}>
              <PrimaryButton loading={approve.isPending} onPress={() => void approveRequest(request.id)}>Duyet</PrimaryButton>
              <SecondaryButton loading={reject.isPending} onPress={() => void rejectRequest(request.id)}>Tu choi</SecondaryButton>
            </View>
          </SectionCard>
        ))}
        {!pending.length ? <EmptyState title="Khong co don pending" /> : null}
      </ScrollView>
    </Screen>
  );
}

function LeaveRequestCard({ request }: { request: LeaveRequest }) {
  return (
    <View style={styles.cardInner}>
      <View style={styles.row}>
        <Text style={styles.title}>{request.leaveType?.name ?? request.leaveTypeId}</Text>
        <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
      </View>
      <Text style={styles.text}>{formatDate(request.startDate)} - {formatDate(request.endDate)}</Text>
      <Text style={styles.text}>So ngay: {request.totalDays}</Text>
      <Text style={styles.muted}>{request.reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  cardInner: {
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
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
});
